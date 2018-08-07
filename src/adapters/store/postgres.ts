import { Pool } from 'pg';
import { v4 } from 'uuid';
import { StoreAdapter, Event, EventData, EventContext } from '../../.';
import { Option, None} from 'funfix';

export interface PgQuery {
  text: string;
  values?: any[];
}

const eventsTable = `
  CREATE TABLE IF NOT EXISTS events(
    id UUID DEFAULT uuid_generate_v4() primary key,
    data JSONB NOT NULL,
    context JSONB DEFAULT '{}',
    time TIMESTAMP DEFAULT now()
  );
`;

export function createPgStoreAdapter(pool: Pool): StoreAdapter<PgQuery> {

  pool.query(eventsTable).catch((error) => {
    throw error;
  });

  async function* read<T extends Event<EventData, EventContext<any>>>(
    query: PgQuery,
    since: Option<string> = None,
  ): AsyncIterator<T> {
    const cursorId = v4();
    const transaction = await pool.connect();
    const cached_query = `
      SELECT * FROM (${query}) AS events
      ${since.map((time) => ` WHERE events.time > (${time})`).getOrElse('')}
      ORDER BY events.time ASC;
    `;
    try {
      await transaction.query('BEGIN');
      await transaction.query({text: `DECLARE ${cursorId} CURSOR FOR ${cached_query}`, values: query.values});
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
    } catch (error) {
      throw error;
    } finally {
      transaction.release();
    }
    yield 1 as any;
  }

  async function write(event: Event<EventData, EventContext<any>>) {
    await pool.query(
      'INSERT INTO events(id, data, context) values ($1, $2, $3)',
      [event.id, event.data, event.context],
    );
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
