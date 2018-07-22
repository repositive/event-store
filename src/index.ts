import { Pool } from 'pg';
import * as R from 'ramda';
import { Future, Option } from 'funfix';
import { createHash } from 'crypto';

export interface EventData {
  type: string;
}

interface EventContext<A> {
  action?: string;
  actor: A;
  time: string; // ISO TIMESTAMP String
}

export interface Event<A, D extends EventData, C extends EventContext<A>> {
  id: string;
  data: D;
  context: C;
}

export type Aggregate<T> = (args: any[]) => Promise<T>;
type ValidateF<E extends EventData> = (o: any) => o is E;
type ExecuteF<T, E extends EventData> = (acc: T, ev: E) => T;
type AggregateMatch<A, T extends EventData> = [ValidateF<T>, ExecuteF<A, T>];
type AggregateMatches<T> = Array<AggregateMatch<T, any>>;

export interface EventStore {
  readAll(filters: {[k: string]: number | string}): Promise<Array<Event<any, any, any>>>;
  save<D extends EventData, C extends EventContext<any>>(data: D, context: C): Promise<Event<any, D, C>>;
  storeIfNotExisting<E extends Event<any, any, any>>(e: E): Promise<E>;
  registerAggregate<A extends any[], T>(query: string, accumulator: T, matches: AggregateMatches<T>): Aggregate<T>;
}

const eventsTable = `
  CREATE TABLE IF NOT EXISTS events(
    id UUID DEFAULT uuid_generate_v4() primary key,
    data JSONB NOT NULL,
    context JSONB NOT NULL
  );
`;

const aggregatesTable = `
  CREATE TABLE IF NOT EXISTS aggregates(
    id VARCHAR(64) NOT NULL primary key,
    data JSONB NOT NULL
  );
`;

const upsertAggregates = `
  INSERT INTO aggregates (id, data)
  VALUES ($1, $2)
  ON CONFLICT (id)
  DO UPDATE SET data = $2;
`;

const aggregateQuery = `select * from aggregates where id = $1`;

export type Emitter = (event: Event<any, any, any>) => void;

export async function newEventStore(pool: Pool, emit: Emitter): Promise<EventStore> {
  await pool.query(eventsTable);
  await pool.query(aggregatesTable);

  async function readAll(filters: {[k: string]: number | string}) {
    const filterPairs = R.toPairs(filters);
    const where = filterPairs.map(([k, v], i) => {
      return `events.data->>'${k}' = $${i + 1}`;
    })
    .join(" AND ");
    const query = `
      SELECT * FROM events
      WHERE ${where}
      ORDER BY events.time ASC;
    `;
    console.log(query);
    const filterList = filterPairs.map(([k, v]) => v);
    console.log(filterList);
    const res = await pool.query(query, filterList);
    return Promise.resolve(res.rows);
  }

  function registerAggregate<T>(
    query: string,
    accumulator: T,
    matches: AggregateMatches<T>,
  ): Aggregate<T> {

    async function _impl(...args: any[]): Promise<T> {
      // TODO: Use an iterator instead of a full query here
      const results = await pool.query(query, args);

      const id = createHash('sha256')
        .update(query + JSON.stringify(args))
        .digest('hex');

      const latestSnapshot = await pool.query(aggregateQuery, [id])
        .then((aggResult) => Option.of(aggResult.rows[0]));

      const aggregatedResult = await results.rows.reduce((acc, event) => {
        return matches.reduce((matchAcc, [validate, execute]) => {
          if (validate(event)) {
            return execute(matchAcc, event);
          }
          return matchAcc;
        }, acc);
      }, latestSnapshot.getOrElse(accumulator));

      await pool.query(upsertAggregates, [id, aggregatedResult]);

      return aggregatedResult;
    }

    return _impl;
  }

  async function storeIfNotExisting<E extends Event<any, any, any>>(e: E) {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        INSERT INTO events(id, data, context)
        values($1, $2, $3) RETURNING *
        WHERE NOT EMPTY (
          SELECT id FROM events WHERE id = $1
        )
      `,
        [e.id, e.data, e.context]);

      const savedEventOpt = Option.of(R.path(['rows', 0], result));

      savedEventOpt.map(emit);

      await client.query(`COMMIT`);

      return e;
    } catch (error) {
      client.query('ROLLBACK');
      return Promise.reject(error);
    } finally {
      client.release();
    }
  }

  async function save<D extends EventData, C extends EventContext<any>>(data: D, context: C) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const event = await client.query(`
        INSERT INTO events(data) values($1)
        RETURNING *
      `, [data]).then((res) => res.rows[0]);

      await client.query(`COMMIT`);

      emit(event);
      return Promise.resolve(event);
    } catch (error) {
      await client.query('ROLLBACK');
      return Promise.reject(error);
    } finally {
      client.release();
    }
  }

  return {
    readAll,
    registerAggregate,
    save,
    storeIfNotExisting,
  };
}
