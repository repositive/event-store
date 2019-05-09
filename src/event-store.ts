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
  Subscriptions,
} from '.';
import { None, Option, Either } from 'funfix';
import { createHash } from 'crypto';

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

/**
Main event store class

An event store requires an implementation of three things; {@link StoreAdapter},
{@link EmitterAdapter} and {@link CacheAdapter}. The following example uses Postgres for the backing
store and cache, and an AMQP (RabbitMQ) queue to emit and subscribe to events. Note the typo in
`AQMPEmitterAdapter`.

```typescript
import {
  createAQMPEmitterAdapter,
  createPgStoreAdapter,
  createPgCacheAdapter,
  EventStore
} from '@repositive/event-store';

const emitterAdapter = createAQMPEmitterAdapter(irisOpts);
const storeAdapter = createPgStoreAdapter(postgres);
const cacheAdapter = createPgCacheAdapter(postgres);

const store = new EventStore(storeAdapter, {cache: cacheAdapter, emitter: emitterAdapter});
```

The store uses `console` as its default logger, but can be overridden by passing in extra arguments.
The following example uses [Pino](http://npmjs.com/pino).

```typescript
import * as pino from 'pino';
import {
  createAQMPEmitterAdapter,
  createPgStoreAdapter,
  createPgCacheAdapter,
  EventStore
} from '@repositive/event-store';

const logger = pino();

const emitterAdapter = createAQMPEmitterAdapter(irisOpts, logger);
const storeAdapter = createPgStoreAdapter(postgres, logger);
const cacheAdapter = createPgCacheAdapter(postgres, logger);

const store = new EventStore(
  storeAdapter,
  {cache: cacheAdapter, emitter: emitterAdapter, logger}
);
```

Any logger can be used that implements the {@link Logger} interface.

@param Q - The query type of the backing store

For example, when using a Postgres store, this should be `string`. Other databases may accept
different types
*/
export class EventStore<Q> {
  private store: StoreAdapter<Q>;
  private cache: CacheAdapter;
  private emitter: EmitterAdapter;
  private logger: Logger;

  /**
  Create a new event store

  @param store_adapter - The backing store used to save and retrieve events

  @param options - Cache adapter, emitter adapter and (optional) logger to use
  */
  constructor(store_adapter: StoreAdapter<Q>, options: EventStoreOptions = {}) {
    this.store = store_adapter;
    this.cache = options.cache || createDumbCacheAdapter();
    this.emitter = options.emitter || createDumbEmitterAdapter();
    this.logger = options.logger || console;
  }

  /**
  Save an event and emit it onto the queue

  @param event - The event to save and emit
  */
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

  /**
  Prepare and return an aggregator function

  Use this to create an aggregate that can be used by the rest of the application.

  @example

  ```typescript
  import { EventStore, PgQuery, Aggregate, isEventType } from '@repositive/event-store';
  import {
    isThingCreated,
    isThingUpdated,
    ThingUpdated,
    ThingCreated
  } from './events';

  export interface Thing {
    // ...
  }

  const onThingCreated = async (
    acc: Option<Thing>,
    event: Event<ThingCreated, EventContext<any>>
  ): Promise<Option<Thing>> => {
    // ...
  };

  const onThingUpdated = async (
    acc: Option<Thing>,
    event: Event<ThingUpdated, EventContext<any>>
  ): Promise<Option<Thing>> => {
    // ...
  };

  const isThingCreated = isEventType<ThingCreated>('thing', 'ThingCreated');
  const isThingUpdated = isEventType<ThingUpdated>('thing', 'ThingUpdated');

  export function prepareThingById(
    store: EventStore<PgQuery>
  ): Aggregate<[string], Thing> {
    return store.createAggregate(
      'thingById',
      {
        text: `select * from events where data->>'thing_id' = $1`
      },
      [
        [isThingCreated, onThingCreated],
        [isThingUpdated, onThingUpdated]
      ]
    );
  }
  ```

  The above example will create an aggregator with the identifier `ThingById` that accepts one
  argument (a thing ID) and returns the fictional `Thing` object. It queries the database for all
  events that contain a data field called `thing_id` with a value equal to the given input.

  It supports two events; `ThingCreated` and `ThingUpdated`, handled by `onThingCreated` and
  `onThingUpdated` respectively.

  @param aggregateName - The unique identifier of this aggregate. It is good convention to name it
  the same as the aggregate function, i.e. `thingById` in the example above.

  @param query - The query sent to the database to select events to aggregate over. This can return
  other events than those desired; they will be ignored if no handler for them is specified in the
  `matches` list.

  @param matches - A list of pairs where the first item determines whether the second should be
  executed. `matches` is evaluated against every event returned from the backing store, with the
  first match from top to bottom being called for that event. This defines the relationship between
  events and their handlers.

  The {@link isEventType} helper can be used to reduce boilerplate. An example `isThingCreated`
  function may look like this:

  ```typescript
  import { isEventType } from "@repositive/event-store";

  export const isThingCreated = isEventType<ThingUpdated>('thingdomain', 'ThingUpdated');
  ```

  @returns Result of aggregation over queried events
  */
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

      this.logger.trace(latestSnapshot, 'eventStoreCacheSnapshot');
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

      this.logger.trace(
        { query, aggregatedResult, time: Date.now() - start },
        'eventStoreAggregatedResult',
      );

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
          return this.cache.set(id, {
            data: result,
            time: aggregatedAt.toISOString(),
          });
        }
      });

      this.logger.trace(
        {
          query,
          args,
          query_time: aggregatedAt.getTime() - start,
          aggregate_time: Date.now() - aggregatedAt.getTime(),
          total_time: Date.now() - start,
        },
        'eventStoreAggregateLatency',
      );

      return aggregatedResult;
    };

    return _impl;
  }

  /**
  Listen for events emitted by other event stores. The event __will__ exist in the backing store
  before the handler is called, so can be aggregated on safely.

  @param event_namespace - The remote namespace to listen to

  @param event_type - The event type to listen for

  @param handler - Handler function called for every received event.

  The handler must return an `Either<undefined, undefined>`. To mark an event as successfully
  handled, return `Right(undefined)`.

  @example Handle the `SomeEvent` event.

  ```typescript
  import { Either, Left, Right, EventStore } from 'funfix';
  import { Event } from '@repositive/event-store';

  let store = new EventStore(...);

  store.listen(
      'some_namespace',
      'SomeEvent',
      async (event: Event<SomeEvent, any>, store: EventStore) => {
          try {
              // ... event handling logic ...

              // Event was handled successfully
              return Right(undefined);
          } catch (e) {
              // Something went wrong
              return Left(undefined);
          }
      }
  );
  ```
  */
  public async listen<T extends EventData>(
    event_namespace: T['event_namespace'],
    event_type: T['event_type'],
    handler: EventHandler<Q, Event<T, EventContext<any>>>,
  ): Promise<void> {
    const _handler = async (event: Event<any, any>) => {
      return (await handler(event, this)).getOrElse(Promise.resolve());
    };

    this.logger.trace({ event_namespace, event_type }, 'eventStoreListen');

    await this.emitter.subscribe(event_namespace, event_type, _handler);

    this.logger.trace({ event_namespace, event_type }, 'eventStoreListenerSubscribed');
  }

  /**
  Replay all events from the first event recorded by the store. This will re-call every registered
  event handler for every event in the database. **Use this method with caution.**
  */
  public async replay_all(): Promise<void> {
    const query: any = { text: 'select * from events' };
    const handlers: Subscriptions = this.emitter.subscriptions();
    const events = this.store.read(query, None);

    this.logger.debug('eventStoreReplayAll');

    let iteration = 0;
    let handled = 0;
    // Loop through each event and call handler
    while (true) {
      const _next = await events.next();

      if (_next.done) {
        this.logger.debug(
          { totalEvents: iteration, handledEvents: handled },
          'eventStoreReplayAllComplete',
        );
        return;
      } else {
        const event = _next.value;

        const event_ident =
          [event.data.event_namespace, event.data.event_type].join('.');

        const handler = handlers.get(event_ident);

        this.logger.trace(
          {
            event,
            event_ident,
            handler_type: typeof handler,
            registered_handlers: [...handlers.keys()],
            iteration,
          },
          'replayAllEvent',
        );

        // Execute handler
        if (handler) {
          handled++;
          await handler(event);
        }
      }

      iteration++;
    }
  }
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
