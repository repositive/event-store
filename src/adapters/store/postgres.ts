import { Pool } from 'pg';
import { v4 } from 'uuid';
import { StoreAdapter, Event, EventData, EventContext } from '../../.';
import { Option, None} from 'funfix';
import { Logger } from '../../.';

export interface PgQuery {
  text: string;
  values?: any[];
}

const eventsTable = `
  CREATE TABLE IF NOT EXISTS events(
    id UUID DEFAULT uuid_generate_v4() primary key,
    data JSONB NOT NULL,
    context JSONB DEFAULT '{}'
  );
`;

export function createPgStoreAdapter(pool: Pool, logger: Logger = console): StoreAdapter<PgQuery> {

  pool.query(eventsTable).catch((error) => {
    throw error;
  });

  async function* read<T extends Event<EventData, EventContext<any>>>(
    query: PgQuery,
    since: Option<string> = None,
    // tslint:disable-next-line trailing-comma
    ...args: any[]
  ): AsyncIterator<T> {
    const cursorId = `"${v4()}"`;
    const transaction = await pool.connect();
    const fmtTime = since.map((t: any) => t instanceof Date ? t.toISOString() : t);
    const where_time = fmtTime.map((t) => `WHERE events.context->>'time' > '${t}'`).getOrElse('');
    const cached_query = `
      SELECT * FROM (${query.text}) AS events
      ${where_time}
      ORDER BY events.context->>'time' ASC
    `;
    try {
      await transaction.query('BEGIN');
      const cursorQuery = {text: `DECLARE ${cursorId} CURSOR FOR (${cached_query})`, values: args};
      logger.trace('Cursor query', cursorQuery);
      await transaction.query(cursorQuery);
      while (true) {
        const results = await transaction.query(`FETCH 100 FROM ${cursorId}`);
        if (results.rowCount > 0) {
          for (const row of results.rows) {
            yield row;
          }
        } else {
          break;
        }
      }

      await transaction.query('COMMIT');
    } catch (error) {
      logger.error('errorInCursor', error);
      throw error;
    } finally {
      transaction.release();
    }
  }

  async function write(event: Event<EventData, EventContext<any>>) {
    return pool.query(
      'INSERT INTO events(id, data, context) values ($1, $2, $3)',
      [event.id, event.data, event.context],
    ).then(() => {/**/});
  }

  async function lastEventOf<E extends Event<any, any>>(eventType: string): Promise<Option<E>> {
    return pool.query(
      `select * from events where data->>'type' = $1 order by context->>'time' desc limit 1`,
      [eventType],
    ).then((results) => Option.of(results.rows[0]));
  }

  function readEventSince(eventType: string, since: Option<string> = None): AsyncIterator<Event<any, any>> {
    return read(
      {
        text: `select * from events where data->>'type' = $1`,
        values: [eventType],
      },
      since,
    );
  }

  return {
    read,
    write,
    lastEventOf,
    readEventSince,
  };
}
