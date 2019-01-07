import {
  Event,
  EventData,
  EventContext,
  StoreAdapter,
  DuplicateError,
  CacheAdapter,
  EmitterAdapter,
  Logger,
  createDumbCacheAdapter,
  createDumbEmitterAdapter,
  Aggregator,
} from '.';
import { None, Some, Option, Either } from 'funfix';
import { v4 } from 'uuid';
import { createHash } from 'crypto';
import { createEvent } from './helpers';

export type Aggregate<A extends any[], T> = (...args: A) => Promise<Option<T>>;
export type ValidateF<E extends Event<any, any>> = (o: any) => o is E;
export type ExecuteF<T, E extends Event<any, any>> = (acc: Option<T>, ev: E) => Promise<Option<T>>;
export type AggregateMatch<A, T extends Event<any, any>> = [ValidateF<T>, ExecuteF<A, T>];
export type AggregateMatches<T> = Array<AggregateMatch<T, any>>;

export type EventHandler<Q, T extends Event<EventData, EventContext<any>>> = (
  event: T,
  store: EventStore<Q>,
) => Promise<Either<undefined, undefined>>;

export interface EventStoreOptions {
  cache?: CacheAdapter;
  emitter?: EmitterAdapter;
  logger?: Logger;
}

export class EventStore<Q> {
  private store: StoreAdapter<Q>;
  private cache: CacheAdapter;
  private emitter: EmitterAdapter;
  private logger: Logger;

  constructor(store_adapter: StoreAdapter<Q>, options: EventStoreOptions = {}) {
    this.store = store_adapter;
    this.cache = options.cache || createDumbCacheAdapter();
    this.emitter = options.emitter || createDumbEmitterAdapter();
    this.logger = options.logger || console;

    this.emitter.subscribe<Event<EventReplayRequested, any>>(
      '_eventstore.EventReplayRequested',
      createEventReplayHandler({store: this.store, emitter: this.emitter}),
    );
  }

  public async save(event: Event<EventData, EventContext<any>>): Promise<void> {
    await this.store.write(event).then((result) => {
      return result
        .map(() => {
          // If there are no errors saving, emit the event
          return this.emitter.emit(event);
        })
        .getOrElseL(() => {
          return result
            .swap()
            .map((error) => {
              if (error instanceof DuplicateError) {
                return Promise.resolve();
              }
              return Promise.reject(error);
            })
            .get();
        });
    });
  }

  public createAggregate<A extends any[], T>(
    aggregateName: string,
    query: Q,
    matches: AggregateMatches<T>,
  ): Aggregate<A, T> {
    const _impl = async (...args: A): Promise<Option<T>> => {
      const start = Date.now();

      const id = createHash('sha256')
        .update(aggregateName + JSON.stringify(query) + JSON.stringify(args))
        .digest('hex');

      const latestSnapshot = await this.cache.get<T>(id);

      this.logger.trace('cacheSnapshot', latestSnapshot);
      const results = this.store.read(
        query,
        latestSnapshot.flatMap((snapshot) => Option.of(snapshot.time)),
        ...args,
      );

      const aggregatedAt = new Date();
      const aggregator = composeAggregator(matches);

      const aggregatedResult = await reduce<Event<EventData, EventContext<any>>, Option<T>>(
        results,
        latestSnapshot.map((snapshot) => snapshot.data),
        aggregator,
      );

      this.logger.trace('aggregatedResult', aggregatedResult);

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
          this.logger.trace('save to cache', result);
          return this.cache.set(id, { data: result, time: aggregatedAt.toISOString() });
        }
      });

      this.logger.trace('aggregateLatency', {
        query,
        args,
        query_time: aggregatedAt.getTime() - start,
        aggregate_time: Date.now() - aggregatedAt.getTime(),
        total_time: Date.now() - start,
      });

      return aggregatedResult;
    };

    return _impl;
  }

  public async listen<T extends EventData>(
    event_namespace: T['event_namespace'],
    event_type: T['event_type'],
    handler: EventHandler<Q, any>,
  ): Promise<void> {
    const pattern = [event_namespace, event_type].join('.');

    const _handler = async (event: Event<any, any>) => {
      const exists = await this.store.exists(event.id);
      if (!exists) {
        const result = await handler(event, this);
        await result
          .map(() => {
            return this.store.write(event);
          })
          .getOrElse(Promise.resolve());
      }
    };

    this.emitter.subscribe(pattern, _handler);

    const last = await this.store.lastEventOf(pattern);

    const replay = createEvent<EventReplayRequested>('_eventstore', 'EventReplayRequested', {
      requested_event_namespace: event_namespace,
      requested_event_type: event_type,
      since: last.map((l) => l.context.time).getOrElse(new Date(0).toISOString()),
    });

    await this.emitter.emit(replay);
  }
}

export interface EventReplayRequested extends EventData {
  type: '_eventstore.EventReplayRequested';
  event_namespace: '_eventstore';
  event_type: 'EventReplayRequested';
  requested_event_type: string;
  requested_event_namespace: string;
  since: string; // ISO String
}

export async function reduce<I, O>(
  iter: AsyncIterator<I>,
  acc: O,
  f: (acc: O, next: I) => Promise<O>,
): Promise<O> {
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

/**
 *  Compose a list of maching functions into an aggregator
 *
 */
export function composeAggregator<T>(matches: AggregateMatches<T>): Aggregator<T> {
  return async (acc: Option<T>, event: Event<EventData, any>) => {
    return matches.reduce((matchAcc, [validate, execute]) => {
      if (validate(event)) {
        return execute(matchAcc, event);
      }
      return matchAcc;
    }, acc);
  };
}

export function createEventReplayHandler({
  store,
  emitter,
}: {
  store: StoreAdapter<any>;
  emitter: EmitterAdapter;
}) {
  return async function handleEventReplay(event: Event<EventReplayRequested, EventContext<any>>) {
    const events = store.readEventSince(
      [event.data.requested_event_namespace, event.data.requested_event_type].join('.'),
      Option.of(event.data.since),
    );

    // Emit all events;
    reduce(events, None, async (acc, e) => {
      await emitter.emit(e);
      return None;
    });
  };
}
