import { Pool } from 'pg';
import * as R from 'ramda';
import { Future, Option, None } from 'funfix';
import { createHash } from 'crypto';

import _logger from './logger';

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

export type Aggregate<A extends any[], T> = (...args: A) => Promise<T>;
type ValidateF<E extends EventData> = (o: any) => o is E;
type ExecuteF<T, E extends EventData> = (acc: T, ev: E) => T;
type AggregateMatch<A, T extends EventData> = [ValidateF<T>, ExecuteF<A, T>];
type AggregateMatches<T> = Array<AggregateMatch<T, any>>;

export interface EventStore {
  save<D extends EventData, C extends EventContext<any>>(data: D, context: C): Promise<Event<any, D, C>>;
  storeIfNotExisting<E extends Event<any, any, any>>(e: E): Promise<E>;
  registerAggregate<A extends any[], T>(
    aggregateName: string,
    query: string,
    accumulator: T,
    matches: AggregateMatches<T>,
  ): Aggregate<A, T>;
}

// const eventsTable = `
//   CREATE TABLE IF NOT EXISTS events(
//     id UUID DEFAULT uuid_generate_v4() primary key,
//     data JSONB NOT NULL,
//     context JSONB DEFAULT '{}',
//     time TIMESTAMP DEFAULT now()
//   );
// `;

// const aggregateCacheTable = `
//   CREATE TABLE IF NOT EXISTS aggregate_cache(
//     id VARCHAR(64) NOT NULL,
//     aggregate_type VARCHAR NOT NULL,
//     data JSONB NOT NULL,
//     PRIMARY KEY(id, aggregate_type),
//     time TIMESTAMP DEFAULT now()
//   );
// `;

const upsertAggregateCache = `
  INSERT INTO aggregate_cache (id, data)
  VALUES ($1, $2)
  ON CONFLICT (id)
  DO UPDATE SET data = $2;
`;

const aggregateCacheQuery = `select * from aggregate_cache where id = $1`;

export type Emitter = (event: Event<any, any, any>) => void;

export async function newEventStore(pool: Pool, emit: Emitter): Promise<EventStore> {
  // await pool.query(eventsTable);
  // await pool.query(aggregateCacheTable);

  function registerAggregate<A extends any[], T>(
    aggregateName: string,
    query: string,
    accumulator: T,
    matches: AggregateMatches<T>,
    logger: any = _logger,
  ): Aggregate<A, T> {
    async function _impl(...args: A): Promise<T> {
      const start = Date.now();

      // TODO: Use an iterator instead of a full query here

      const id = createHash('sha256')
        .update(query + JSON.stringify(args))
        .digest('hex');

      const latestSnapshot = await pool.query(aggregateCacheQuery, [id])
        .then((aggResult) => {
          return {
            data: Option.of(R.path(['rows', 0, 'data'], aggResult)),
            time: Option.of(R.path(['rows', 0, 'time'], aggResult)),
          };
        });

      const cached_query =
      `
        select * from (${query}) as events` +
        latestSnapshot.time.map((time) => ` where events.time > (${time})`).getOrElse('') +
      `
        order by events.time asc;`;

      const results = await pool.query(cached_query, args);

      const queryTime = Date.now();

      const aggregatedResult = await results.rows.reduce((acc, row) => {
        return matches.reduce((matchAcc, [validate, execute]) => {
          if (validate(row.data)) {
            return execute(matchAcc, row.data);
          }
          return matchAcc;
        }, acc);
      }, latestSnapshot.data);

      if (aggregatedResult.nonEmpty()) {
        await pool.query(upsertAggregateCache, [id, aggregatedResult.get()]);
      }

      logger.trace(
        'aggregateLatency',
        {
          query,
          args,
          query_time: queryTime - start,
          aggregate_time: Date.now() - queryTime,
          total_time: Date.now() - start,
        });

      return aggregatedResult;
    }

    return _impl;
  }

  async function storeIfNotExisting<E extends Event<any, any, any>>(e: E) {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        INSERT INTO events(id, data, context)
        values($1, $2, $3)
        ON CONFLICT (id) DO NOTHING
        RETURNING *
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

  async function save<D extends EventData, C extends EventContext<any>>(data: D, context?: C) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const event = await client.query(
        'INSERT INTO events(data, context) values($1) RETURNING *',
        [data, context],
      )
      .then((res) => res.rows[0]);

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
    registerAggregate,
    save,
    storeIfNotExisting,
  };
}
