import { Option } from "funfix";

/**
A UUID

This is a UUID stored without wrapping characters

@example `cafebabe-cafe-babe-cafe-babecafebabe`
@example `5ec93584-9e86-4aa5-b5d4-7ff84f1b82fa`
*/
export type Uuid = string;

/**
ISO8601 formatted date string
*/
export type IsoDateString = string;

/**
An event's namespace

The lowercase namespace to which an event belongs

@example `accounts`
@example `organisations`
*/
export type EventNamespace = string;

/**
An event's type

The TitleCase identifier for an event in past tense

@example `ProfileUpdated`
@example `InviteAccepted`
*/
export type EventType = string;

/**
An aggregator function for an event

__Important:__ The result of an aggregate is cached, therefore an aggregate's computation must be
idempotent. Computations that use externally changing values like timestamps or other globals should
wrap the aggregate in another function so the cache stays valid.

@param acc - The current state of the aggregation. This is `None` on the first iteration, or the
return value of the previous aggregate application, which may also return `None`.

@param event - The event to process
*/
export type Aggregator<T> = (acc: Option<T>, event: Event<EventData, any>) => Promise<Option<T>>;

/**
The data payload of an event

A complete event is defined by the {@link Event} type. This interface defines that the event type
be present in the data payload, defined by `event_type` and `event_namespace`. Domain event
definitions __should not__ override the fields defined in this interface. The event store assumes
ownership of these fields and will usually overwrite any fields with the same name in user data.
*/
export interface EventData {
  event_namespace: EventNamespace;
  event_type: EventType;
}

/**
Event context

The context of an event. The event's creation time is stored in the `time` field and __should not be
duplicated in the event data.__

A `subject` must also be provided. This will contain information about the creator of the event. If
no subject can be provided, this should default to an empty object `{}`.

The `action` field can be used to describe which operation or other trigger created this event.
*/
export interface EventContext<A> {
  action?: string;
  subject: A;
  time: IsoDateString; // ISO TIMESTAMP String
}

/**
A complete event

Domain events should extend this type. It defines a unique event ID, a data payload containing the
event namespace and type that extends {@link EventData}, and a context object that extends
{@link EventContext}
*/
export interface Event<D extends EventData, C extends EventContext<any>> {
  /**
  Event ID
  */
  id: Uuid;

  /**
  Event data

  Stores event data payload and the type of this event
  */
  data: D;

  /**
  Event context

  Stores the event creation time, subject and optional action specifier
  */
  context: C;
}

export interface Logger {
  trace(...args: any[]): void;
  debug(...args: any[]): void;
  info(...args: any[]): void;
  warn(...args: any[]): void;
  error(...args: any[]): void;
}
