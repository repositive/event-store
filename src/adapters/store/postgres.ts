import { Pool } from "pg";
import { v4 } from "uuid";
import {
  StoreAdapter,
  DuplicateError,
  Event,
  EventData,
  EventContext,
  EventNamespace,
  EventType,
} from "../../.";
import { Option, None, Either, Left, Right } from "funfix";
import { Logger, IsoDateString } from "../../.";

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
    since: Option<IsoDateString> = None,
    // tslint:disable-next-line trailing-comma
    ...args: any[]
  ): AsyncIterator<T> {
    const cursorId = `"${v4()}"`;
    const transaction = await pool.connect();
    const fmtTime = since.map((t: any) => (t instanceof Date ? t.toISOString() : t));
    const where_time = fmtTime.map((t) => `WHERE events.context->>'time' > '${t}'`).getOrElse("");
    const cached_query = `
      SELECT * FROM (${query.text}) AS events
      ${where_time}
      ORDER BY events.context->>'time' ASC
    `;
    try {
      await transaction.query("BEGIN");
      const cursorQuery = {
        text: `DECLARE ${cursorId} CURSOR FOR (${cached_query})`,
        values: args,
      };
      logger.trace({ cursorQuery }, "eventStoreCursorQuery");
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

      await transaction.query("COMMIT");
    } catch (error) {
      logger.error(error, "eventStoreCursorError");
      throw error;
    } finally {
      transaction.release();
    }
  }

  /**
   *  This will return an either Left(DuplicateError), Left(Error) or Right(void);
   *
   *
   */
  async function write(
    event: Event<EventData, EventContext<any>>
  ): Promise<Either<DuplicateError | Error, void>> {
    return pool
      .query("INSERT INTO events(id, data, context) values ($1, $2, $3)", [
        event.id,
        event.data,
        event.context,
      ])
      .then(() => Right(undefined))
      .catch((err) => {
        if (err instanceof Error) {
          // duplicate key value violates unique constraint "events_pkey"
          if (err.message.includes("violates unique constraint")) {
            return Left(new DuplicateError());
          }
          return Left(err);
        } else {
          return Left(new Error(err));
        }
      });
  }

  async function lastEventOf<E extends Event<any, any>>(
    event_namespace: EventNamespace,
    event_type: EventType
  ): Promise<Option<E>> {
    logger.trace({ event_namespace, event_type }, "eventStoreLastEventOf");

    const start = Date.now();

    return pool
      .query(
        `select * from events
        where data->>'event_namespace' = $1
        and data->>'event_type' = $2
        order by context->>'time' desc limit 1`,
        [event_namespace, event_type]
      )
      .then((results) => {
        logger.trace(
          { event_namespace, event_type, time: Date.now() - start },
          "eventStoreLastEventOfResult"
        );

        return Option.of(results.rows[0]);
      });
  }

  function readEventSince(
    event_namespace: EventNamespace,
    event_type: EventType,
    since: Option<IsoDateString> = None
  ): AsyncIterator<Event<any, any>> {
    return read(
      {
        text: `select * from events where data->>'event_namespace' = $1 and data->>'event_type' = $2`,
      },
      since,
      event_namespace,
      event_type
    );
  }

  return {
    read,
    write,
    lastEventOf,
    readEventSince,
  };
}
