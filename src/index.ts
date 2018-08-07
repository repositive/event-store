import { Pool } from 'pg';
import * as R from 'ramda';
import { Future, Option, None } from 'funfix';
import { createHash } from 'crypto';
import { v4 } from 'uuid';

import _logger from './logger';

async function reduce<I, O>(iter: AsyncIterator<I>, acc: O, f: (acc: O, next: I) => Promise<O>): Promise<O> {
  let _acc = acc;
  while (true) {
    const _next = await iter.next();
    if (_next.done) {
      return _acc;
    } else {
      _acc = await f(_acc, _next.value);
    }
  }
}

interface EventReplayRequested extends EventData {
  type: 'EventReplayRequested';
  event_type: string;
  since: string; // ISO String
}

export interface StoreAdapter<Q> {
  read(query: Q, since?: Option<string>): AsyncIterator<Event<EventData, EventContext<any>>>;
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
  actor: A;
  time: string; // ISO TIMESTAMP String
}

export interface Event<D extends EventData, C extends EventContext<any>> {
  id: string;
  data: D;
  context: C;
}

export type Aggregate<A extends any[], T> = (...args: A) => Promise<Option<T>>;
type ValidateF<E extends EventData> = (o: any) => o is E;
type ExecuteF<T, E extends EventData> = (acc: Option<T>, ev: E) => Promise<Option<T>>;
type AggregateMatch<A, T extends EventData> = [ValidateF<T>, ExecuteF<A, T>];
type AggregateMatches<T> = Array<AggregateMatch<T, any>>;

export interface EventStore<Q> {
  save(event: Event<EventData, EventContext<any>>): Promise<void>;
  createAggregate<A extends any[], T>(
    aggregateName: string,
    query: Q,
    accumulator: T,
    matches: AggregateMatches<T>,
  ): Aggregate<A, T>;
}

export async function newEventStore<Q>(
  store: StoreAdapter<Q>,
  cache: CacheAdapter,
  emitter: EmitterAdapter,
): Promise<EventStore<Q>> {

  function createAggregate<AQ extends Q, A extends any[], T>(
    aggregateName: string,
    query: AQ,
    accumulator: T,
    matches: AggregateMatches<T>,
    logger: any = _logger,
  ): Aggregate<A, T> {
    async function _impl(...args: A): Promise<Option<T>> {
      const start = Date.now();

      const id = createHash('sha256')
        .update(JSON.stringify(query) + JSON.stringify(args))
        .digest('hex');

      const latestSnapshot = await cache.get<T>(id);

      const results = store.read(query, latestSnapshot.flatMap((snapshot) => Option.of(snapshot.time)));

      const aggregatedAt = new Date();
      const aggregatedResult = await reduce<Event<EventData, EventContext<any>>, Option<T>>(
        results,
        latestSnapshot.map((snapshot) => snapshot.data),
        async (acc, event) => {
          return await matches.reduce((matchAcc, [validate, execute]) => {
            if (validate(event.data)) {
              return execute(matchAcc, event.data);
            }
            return matchAcc;
          }, acc);
      });

      await aggregatedResult.map((result) => cache.set(id, {data: result}));

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
    }

    return _impl;
  }

  async function save(event: Event<EventData, EventContext<any>>): Promise<void> {
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
    save,
  };
}
