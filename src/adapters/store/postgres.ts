import { Pool } from 'pg';
import { v4 } from 'uuid';
import { StoreAdapter, Event, EventData, EventContext, ReadOptions } from '../../.';
import { Option, None, Either, Left, Right} from 'funfix';
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
    options: ReadOptions,
    // tslint:disable-next-line trailing-comma
    ...args: any[]
  ): AsyncIterator<T> {
    const cursorId = `"${v4()}"`;
    const transaction = await pool.connect();

    // Appends the value to the array only if the value is not an empty string;
    function appendToArray(arr: string[], value: string) {
      if (value) {
        return [...arr, value];
      }
      return arr;
    }

    const fmtFrom = options.from ? `events.context->>'time' > '${options.from}'` : '';
    const fmtTo = options.to ? `events.context->>'time' < '${options.to}'` : '';
    const time_filters  = appendToArray(appendToArray([], fmtFrom), fmtTo).join(' AND ');

    const where = `WHERE ${time_filters}`;

    const cached_query = `
      SELECT * FROM (${query.text}) AS events
      ${where}
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

  /**
   * Write one or more events to the underlaying store
   * The write operation is executed in a transaction, if one of the writes fail non of the events will be saved.
   * This will return an either Left(Error) or Right(void);
   */
  async function write(data: Event<any, any> | Array<Event<any, any>>): Promise<Either<Error, void>> {
    const transaction = await pool.connect();
    const _data = Array.isArray(data) ? data : [data];
    try {
      const results = await Promise.all(_data.map((event) => {
        return pool.query(
          'INSERT INTO events(id, data, context) values ($1, $2, $3) ON CONFLICT DO NOTHING',
          [event.id, event.data, event.context],
        );
      }));
      return Right(undefined);
      await transaction.query('COMMIT');
    } catch (err) {
      logger.error('error on write transaction', err);
      if (err instanceof Error) {
        return Left(err);
      } else {
        return Left(new Error(err));
      }
    } finally {
      transaction.release();
    }
  }

  async function lastEventOf<E extends Event<any, any>>(eventType: string): Promise<Option<E>> {
    return pool.query(
      `select * from events where data->>'type' = $1 order by context->>'time' desc limit 1`,
      [eventType],
    ).then((results) => Option.of(results.rows[0]));
  }

  async function exists(id: string): Promise<boolean> {
    return pool.query(
      `select * from events where id = $1`,
      [id],
    ).then((results) => !!results.rows[0]);
  }

  function readEventSince(eventType: string, since: Option<string> = None): AsyncIterator<Event<any, any>> {
    return read(
      {
        text: `select * from events where data->>'type' = $1`,
      },
      {
        from: since.getOrElse(undefined),
      },
      eventType,
    );
  }

  return {
    read,
    write,
    lastEventOf,
    readEventSince,
    exists,
  };
}
