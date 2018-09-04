import { Pool } from 'pg';
import * as R from 'ramda';
import { Future, Option, None } from 'funfix';
import { createHash } from 'crypto';
import { v4 } from 'uuid';

export * from './adapters';
import {createDumbCacheAdapter, createDumbEmitterAdapter} from './adapters';

async function reduce<I, O>(iter: AsyncIterator<I>, acc: O, f: (acc: O, next: I) => Promise<O>): Promise<O> {
  let _acc = acc;
  try {
    while (true) {
      const _next = await iter.next();
      if (_next.done) {
        return _acc;
      } else {
        _acc = await f(_acc, _next.value);
      }
    }
  } catch (error) {
    return Promise.reject(error);
  }
}

async function reduceWhile<I, O>(
  whileTrue: (event: I) => boolean,
  iter: AsyncIterator<I>,
  acc: O,
  f: (acc: O, next: I) => Promise<O>,
): Promise<O> {
  let _acc = acc;
  try {
    let cont = true;
    while (cont) {
      const _next = await iter.next();
      if (_next.done) {
        return _acc;
      } else {
        if (whileTrue(_next.value)) {
          _acc = await f(_acc, _next.value);
        } else {
          cont = false;
        }
      }
    }
    return _acc;
  } catch (error) {
    return Promise.reject(error);
  }
}

export function isEvent<D extends EventData, C extends EventContext<any>>(
  isData: (o: any) => o is D = (o: any): o is any => true,
  isContext: (o: any) => o is C = (o: any): o is any => true,
): (o: any) => o is Event<D, C> {
  return function(o: any): o is Event<D, C> {
    return  o &&
            typeof o.id === 'string' &&
            o.data &&
            isData(o.data) &&
            o.context &&
            isContext(o.context);
  };
}

interface EventReplayRequested extends EventData {
  type: 'EventReplayRequested';
  event_type: string;
  since: string; // ISO String
}

export interface StoreAdapter<Q> {
  read(query: Q, since: Option<string>, ...args: any[]): AsyncIterator<Event<EventData, EventContext<any>>>;
  write(event: Event<EventData, EventContext<any>>): Promise<void>;
  lastEventOf<E extends Event<any, any>>(eventType: string): Promise<Option<E>>;
  readEventSince(eventTYpe: string, since?: Option<string>): AsyncIterator<Event<EventData, EventContext<any>>>;
}

export interface CacheEntry<T> {
  time?: string; // ISO String
  data: T;
}

export interface CacheAdapter {
  get<T>(id: string): Promise<Option<CacheEntry<T>>>;
  set<T extends CacheEntry<any>>(id: string, obj: T): Promise<void>;
}

export type EventHandler<T extends Event<EventData, EventContext<any>>> = (event: T) => Promise<void>;

export interface EmitterAdapter {
  subscriptions: Map<string, EventHandler<any>>;
  emit(event: Event<any, any>): Promise<void>;
  subscribe<T extends Event<EventData, EventContext<any>>>(name: string, handler: EventHandler<T>): void;
  unsubscribe(name: string): void;
}

export interface EventData {
  type: string;
}

export interface EventContext<A> {
  action?: string;
  subject: A;
  time: string; // ISO TIMESTAMP String
}

export interface Event<D extends EventData, C extends EventContext<any>> {
  id: string;
  data: D;
  context: C;
}

export type Aggregate<A extends any[], T> = (...args: any[]) => Promise<Option<T>>;
export type AggregateWhile<A extends any[], T> = (...args: any[]) => Promise<WhileTrue<string, T>>;

export type ValidateF<E extends Event<any, any>> = (o: any) => o is E;
export type ExecuteF<T, E extends Event<any, any>> = (acc: Option<T>, ev: E) => Promise<Option<T>>;
export type AggregateMatch<A, T extends Event<any, any>> = [ValidateF<T>, ExecuteF<A, T>];
export type AggregateMatches<T> = Array<AggregateMatch<T, any>>;
export type WhileTrue<K, T> = (args: {
   boolClause: (event: Event<any, any>) => boolean,
   boolClauseArgs: K,
  }) => Promise<Option<T>>;

export interface EventStore<Q> {
  save(event: Event<EventData, EventContext<any>>): Promise<void>;
  createAggregate<A extends any[], T>(
    aggregateName: string,
    query: Q,
    matches: AggregateMatches<T>,
  ): Aggregate<A, T>;
  createAggregateWhile<A extends any[], T>(
    aggregateName: string,
    query: Q,
    matches: AggregateMatches<T>,
  ): AggregateWhile<A, T>;
  listen<T extends string>(pattern: T, handler: EventHandler<Event<{type: T}, any>>): void;
}

export interface Logger {
  trace(...args: any[]): void;
  debug(...args: any[]): void;
  info(...args: any[]): void;
  warn(...args: any[]): void;
  error(...args: any[]): void;
}

export interface EventStoreOptions {
  cache?: CacheAdapter;
  emitter?: EmitterAdapter;
  logger?: Logger;
}

export async function newEventStore<Q>(
  store: StoreAdapter<Q>,
  _options?: EventStoreOptions,
): Promise<EventStore<Q>> {

  const options = _options || {};

  const {
    cache = createDumbCacheAdapter(),
    emitter = createDumbEmitterAdapter(),
    logger = console,
  } = options;

  function createAggregate<AQ extends Q, A extends any[], T>(
    aggregateName: string,
    query: AQ,
    matches: AggregateMatches<T>,
  ): Aggregate<A, T> {
    async function _impl(...args: any[]): Promise<Option<T>> {
      const start = Date.now();

      const id = createHash('sha256')
        .update(JSON.stringify(query) + JSON.stringify(args))
        .digest('hex');

      try {
        const latestSnapshot = await cache.get<T>(id);

        logger.trace('cacheSnapshot', latestSnapshot);
        const results = store.read(query, latestSnapshot.flatMap((snapshot) => Option.of(snapshot.time)), ...args);

        const aggregatedAt = new Date();
        const aggregatedResult = await reduce<Event<EventData, EventContext<any>>, Option<T>>(
          results,
          latestSnapshot.map((snapshot) => snapshot.data),
          async (acc, event) => {
            return await matches.reduce((matchAcc, [validate, execute]) => {
              if (validate(event)) {
                return execute(matchAcc, event);
              }
              return matchAcc;
            }, acc);
        });

        logger.trace('aggregatedResult', aggregatedResult);

        await aggregatedResult.map((result) => {
          const snapshotHash = latestSnapshot
            .map((snapshot) => {
              return createHash('sha256')
                .update(JSON.stringify(snapshot.data))
                .digest('hex');
            })
            .getOrElse('');

          const toCacheHash = createHash('sha256')
            .update(JSON.stringify(result))
            .digest('hex');
          if (snapshotHash !== toCacheHash) {
            logger.trace('save to cache', result);
            return cache.set(id, {data: result, time: aggregatedAt.toISOString()});
          }
        });

        logger.trace(
          'aggregateLatency',
          {
            query,
            args,
            query_time: aggregatedAt.getTime() - start,
            aggregate_time: Date.now() - aggregatedAt.getTime(),
            total_time: Date.now() - start,
          });

        return aggregatedResult;
      } catch (error) {
        logger.error('errorOnReduction', error);
        return Promise.reject(error);
      }
    }

    return _impl;
  }

  function createAggregateWhile<AQ extends Q, A extends any[], T>(
    aggregateName: string,
    query: AQ,
    matches: AggregateMatches<T>,
  ): AggregateWhile<A, T> {

    return async function _impl(...args: any[]) {
      return async function({
        boolClause,
        boolClauseArgs,
      }: {
        boolClause: (event: any) => boolean,
        boolClauseArgs?: string,
      }) {

        const start = Date.now();

        const id = createHash('sha256')
          .update(JSON.stringify(query) + JSON.stringify(args) +
            JSON.stringify(boolClause) + JSON.stringify(boolClauseArgs))
          .digest('hex');

        try {
          const latestSnapshot = await cache.get<T>(id);

          logger.trace('cacheSnapshot', latestSnapshot);
          const results = store.read(query, latestSnapshot.flatMap((snapshot) => Option.of(snapshot.time)), ...args);

          const aggregatedAt = new Date();

          const aggregatedResult = await reduceWhile<Event<EventData, EventContext<any>>, Option<T>>(
            boolClause,
            results,
            latestSnapshot.map((snapshot) => snapshot.data),
            async (acc, event) => {

              return await matches.reduce((matchAcc, [validate, execute]) => {
                if (validate(event)) {
                  return execute(matchAcc, event);
                }
                return matchAcc;
              }, acc);

            });

          logger.trace('aggregatedResult', aggregatedResult);

          await aggregatedResult.map((result: any) => {
            const snapshotHash = latestSnapshot
              .map((snapshot) => {
                return createHash('sha256')
                  .update(JSON.stringify(snapshot.data))
                  .digest('hex');
              })
              .getOrElse('');

            const toCacheHash = createHash('sha256')
              .update(JSON.stringify(result))
              .digest('hex');
            if (snapshotHash !== toCacheHash) {
              logger.trace('save to cache', result);
              return cache.set(id, { data: result, time: aggregatedAt.toISOString() });
            }
          });

          logger.trace(
            'aggregateLatency',
            {
              query,
              args,
              query_time: aggregatedAt.getTime() - start,
              aggregate_time: Date.now() - aggregatedAt.getTime(),
              total_time: Date.now() - start,
            });

          return aggregatedResult;
        } catch (error) {
          logger.error('errorOnReduction', error);
          return Promise.reject(error);
        }
      };
    };
  }

  async function save<T extends string>(event: Event<{type: T}, EventContext<any>>): Promise<void> {
    await store.write(event);
    await emitter.emit(event);
  }

  async function listen(pattern: string, handler: EventHandler<any>) {
    emitter.subscribe(pattern, handler);
    const last = await store.lastEventOf(pattern);
    emitter
      .emit({
        id: v4(),
        data: {
          type: 'EventReplayRequested',
          event_type: pattern,
          since: last.map((l) => l.context.time).getOrElse(new Date(0).toISOString()),
        },
        context: {
          actor: {},
          time: new Date().toISOString(),
        },
      });
  }

  emitter.subscribe('EventReplayRequested', async (event: Event<EventReplayRequested, EventContext<any>>) => {
    const events = store.readEventSince(event.data.event_type, Option.of(event.data.since));

    // Emit all events;
    reduce(events, None, async (acc, e) => {
      await emitter.emit(e);
      return None;
    });
  });

  return {
    createAggregate,
    createAggregateWhile,
    listen,
    save,
  };
}
