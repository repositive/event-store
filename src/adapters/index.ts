import { Option, Either } from "funfix";
import {
  Event,
  EventData,
  EventContext,
  IsoDateString,
  EventNamespace,
  EventType,
  Subscriptions,
} from "..";

export * from "./cache/postgres";
export * from "./cache/redis";
export * from "./cache/dumb";
export * from "./emitter/amqp";
export * from "./emitter/dumb";
export * from "./store/postgres";

/**
An event's joined {@link EventNamespace} and {@link EventType}

This is the union of {@link EventNamespace}, a `.` character and {@link EventType}

@example `accounts.ProfileUpdated`
@example `organisations.InviteAccepted`
*/
type SubscriptionKey = string;

/**
A cache item key

This is a hash generated from the aggregate query and query arguments that produce an aggregate
result. This produces cache items that are invalidated when the aggregate query changes, and are
also unique to each set of query parameters passed to the aggregator.
*/
export type CacheKey = string;

/**
A cache entry returned when searching by {@link CacheKey}
*/
export interface CacheEntry<T> {
  /**
  Timestamp of the cache insertion date
  */
  time: IsoDateString;

  /**
  The cache object to insert
  */
  data: T;
}

/**
The interface a cache backing store must implement
*/
export interface CacheAdapter {
  /**
  Fetch a cached item by its {@link CacheKey} ID
  */
  get<T>(id: CacheKey): Promise<Option<CacheEntry<T>>>;

  /**
  Store an item in the cache
  */
  set<T extends CacheEntry<any>>(id: CacheKey, obj: T): Promise<void>;
}

/**
Event handler for received events

Handler functions are only called when an incoming event has been saved successfully. If the event
is already present in the database, or failed to be saved by the {@link StoreAdapter} backing store,
this handler will not be called. **As the event has already been saved by the store internally, the
programmer is not required to save the event in the handler.**

Functions with this signature should be passed to `Store.subscribe` to handle incoming events.
*/
export type EmitterHandler<T extends Event<EventData, EventContext<any>>> = (
  event: T
) => Promise<void>;

/**
Event subscriptions
*/
export type Subscriptions = Map<SubscriptionKey, EmitterHandler<any>>;

/**
The interface an emitter/subscriber backing service must implement

This adapter is used to emit events for other domains to receive and create subscribers to consume
events from other domains.
*/
export interface EmitterAdapter {
  /**
  Emit a complete {@link Event} for consumption by other domains

  @param event - The complete {@link Event} to emit with ID, data payload and context
  */
  emit<D extends EventData>(event: Event<D, EventContext<any>>): Promise<void>;

  /**
  Subscribe to incoming events

  @param ns - A string identifying the **namespace** of the event that this subscription should
  consume. This should look something like `accounts` or `organisations`.

  @param ty - A string identifying the **type** of the event that this subscription should consume.
  This should look something like `LoggedIn` or `OrganisationUpdated`.

  @param handler - An {@link EmitterHandler} function called when the incoming event has been saved
  successfully. Any domain-specific logic like sending a notification or triggering some data
  processing should be performed here.
  */
  subscribe<T extends Event<EventData, EventContext<any>>>(
    ns: T["data"]["event_namespace"],
    ty: T["data"]["event_type"],
    handler: EmitterHandler<T>
  ): void;

  /**
  Return a list of event identifiers and handlers
  */
  subscriptions(): Subscriptions;
}

/**
Returned when an attempt was made to save an event, but an event by the given ID already exists in
the backing store
*/
export class DuplicateError extends Error {}

/**
Store adapter interface

The store adapter should handle saving and reading of all events stored by the domain
*/
export interface StoreAdapter<Q> {
  /**
  Execute a query returning a list of events in an iterable stream

  @param query - The query to execute. This may be a string, as in the {@link PgStoreAdapter} or any
  other type that the backing store accepts

  @param since - An optional ISO8601 date string specifying when to query events from. If this is
  `None`, no time limit should be placed on queried events

  @param ...args - A list of arguments used in the query
  */
  read(
    query: Q,
    since: Option<IsoDateString>,
    // tslint:disable-next-line trailing-comma
    ...args: any[]
  ): AsyncIterator<Event<EventData, EventContext<any>>>;

  /**
  Save an event to the backing store

  @param event - The complete {@link Event} to save
  */
  write(event: Event<EventData, EventContext<any>>): Promise<Either<DuplicateError, void>>;

  /**
  Find the most recent occurrence of an event in the store

  @param ns - The namespace of the event to filter for. This should be a string like `accounts`

  @param ty - The type of the event to filter for. This should be a string like `ProfileUpdated`

  @returns The most recent found event, or `None` if no event could be found
  */
  lastEventOf<E extends Event<any, any>>(ns: EventNamespace, ty: EventType): Promise<Option<E>>;

  /**
  Read all events created at or after a given time

  @param ns - The namespace of the event to filter for. This should be a string like `accounts`

  @param ty - The type of the event to filter for. This should be a string like `ProfileUpdated`

  @param since - ISO8601 date string specifying when to read events from. If passed as `None` or
  omitted, all events matching `eventType` should be returned
  */
  readEventSince(
    ns: EventNamespace,
    ty: EventType,
    since?: Option<IsoDateString>
  ): AsyncIterator<Event<EventData, EventContext<any>>>;
}
