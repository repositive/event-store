import { Event, EventData, EventContext, StoreAdapter, CacheAdapter, EmitterAdapter, Logger, Aggregator, IsoDateString, EventType, EventNamespace } from ".";
import { Option, Either } from "funfix";
export declare type Aggregate<A extends any[], T> = (...args: A) => Promise<Option<T>>;
export declare type ValidateF<E extends Event<any, any>> = (o: any) => o is E;
export declare type ExecuteF<T, E extends Event<any, any>> = (acc: Option<T>, ev: E) => Promise<Option<T>>;
export declare type AggregateMatch<A, T extends Event<any, any>> = [ValidateF<T>, ExecuteF<A, T>];
export declare type AggregateMatches<T> = Array<AggregateMatch<T, any>>;
export declare type EventHandler<Q, T extends Event<EventData, EventContext<any>>> = (event: T, store: EventStore<Q>) => Promise<Either<undefined, undefined>>;
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
export declare class EventStore<Q> {
    private store;
    private cache;
    private emitter;
    private logger;
    /**
    Create a new event store
  
    @param store_adapter - The backing store used to save and retrieve events
  
    @param options - Cache adapter, emitter adapter and (optional) logger to use
    */
    constructor(store_adapter: StoreAdapter<Q>, options?: EventStoreOptions);
    /**
    Save an event and emit it onto the queue
  
    @param event - The event to save and emit
    */
    save(event: Event<EventData, EventContext<any>>): Promise<void>;
    /**
    Prepare and return an aggregator function
  
    Use this to create an aggregate that can be used by the rest of the application.
  
    @example
  
    ```typescript
    import { EventStore, PgQuery, Aggregate, isEvent } from '@repositive/event-store';
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
  
    export function prepareThingById(
      store: EventStore<PgQuery>
    ): Aggregate<[string], Thing> {
      return store.createAggregate(
        'thingById',
        {
          text: `select * from events where data->>'thing_id' = $1`
        },
        [
          [isEvent(isThingCreated), onThingCreated],
          [isEvent(isThingUpdated), onThingUpdated]
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
  
    The {@link isEvent} helper can be used to reduce boilerplate. An example `isThingCreated` function
    may look like this:
  
    ```typescript
    export function isThingCreated(o: any): o is ThingUpdated {
      return o && o.type === 'thingdomain.ThingUpdated';
    }
    ```
  
    @returns Result of aggregation over queried events
    */
    createAggregate<A extends any[], T>(aggregateName: string, query: Q, matches: AggregateMatches<T>): Aggregate<A, T>;
    /**
    Listen for events emitted by other event stores
  
    When this method is called, a subscription is initialised and an {@link EventReplayRequested}
    event is emitted. This allows this store to receive events it may have missed due to save errors,
    downtime or deployments.
  
    @param event_namespace - The remote namespace to listen to
  
    @param event_type - The event type to listen for
  
    @param handler - Handler function called for every received event. The event will be saved to the
    backing store before this handler is called, therefore can be retrieved with an aggregator. If the
    event cannot be saved, or already exists in the database, the handler will not be called
    */
    listen<T extends EventData>(event_namespace: T["event_namespace"], event_type: T["event_type"], handler: EventHandler<Q, any>): Promise<void>;
}
/**
An event used to request a replay from remote event stores. It uses the `requested_event_type` and
`requested_event_namespace` fields to specify which type of event should be replayed.
*/
export interface EventReplayRequested extends EventData {
    type: "_eventstore.EventReplayRequested";
    event_namespace: "_eventstore";
    event_type: "EventReplayRequested";
    requested_event_type: EventType;
    requested_event_namespace: EventNamespace;
    since: IsoDateString;
}
export declare function reduce<I, O>(iter: AsyncIterator<I>, acc: O, f: (acc: O, next: I) => Promise<O>): Promise<O>;
/**
 *  Compose a list of maching functions into an aggregator
 *
 */
export declare function composeAggregator<T>(matches: AggregateMatches<T>): Aggregator<T>;
export declare function createEventReplayHandler({ store, emitter, }: {
    store: StoreAdapter<any>;
    emitter: EmitterAdapter;
}): (event: Event<EventReplayRequested, EventContext<any>>) => Promise<void>;
