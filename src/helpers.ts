import { EventData, EventContext, Event, IsoDateString, Uuid } from ".";
import { v4 } from "uuid";

function defaultContext(): EventContext<{}> {
  return {
    subject: {},
    time: new Date().toISOString(),
  };
}

export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

/**
Create an event with optional context

This function should be used to create events in code that uses the event store instead of
constructing them manually. It builds an event object with the correct shape and adds a minimal
event context if one is not provided. Importantly, it also typechecks the given event namespace and
type arguments to guard against typos.

__It is strongly recommended you declare the event type when calling this method.__ For example, the
following example will fail to compile due to a typo in the event name, and a missing field in the
event object:

```typescript
import { createEvent, EventData } from '@repositive/event-store';

interface ExampleEvent extends EventData {
  type: 'docs.ExampleEvent';
  event_namespace: 'docs';
  event_Type: 'ExampleEvent';
  foo: number;
  bar: number;
}

// Note typo: `ExmopleEvent`
const event = createEvent<ExampleEvent>('docs', 'ExmopleEvent', {
  foo: 100,
  // Note missing field `bar`
});
```

If the event type is not explicitly given like `createEvent<ExampleEvent>(...)`, Typescript cannot
typecheck the passed arguments, so missing fields and typos are not caught by the compiler.

@param event_namespace - The namespace or domain this event belongs to, e.g. `accounts` or `search`.
This can be typechecked against the returned event interface by explicitly providing the event type
when calling `createEvent` like `createEvent<ExampleEvent>(...)`.

@param event_type - The type of event.
By convention, this should have the same name as the event interface definition to reduce confusion.

@param data - The event's data payload.
This function will overwrite fields named `type`, `event_type` or `event_namespace` in the payload
input with its own values.

@param context - The event's context.
If not provided, `createEvent()` will create a default context with no action, an empty subject
(`{}`) and the current time in ISO8601 format as the event's creation timestamp.

@param _uuid - UUID provider function.
__Only for use in tests__. Override this argument to provide a custom UUID provider. This is useful
when unit testing so that a consistent static value can be passed. For example:

```typescript
import { createEvent, EventData } from '@repositive/event-store';

interface ExampleEvent extends EventData {
  type: 'docs.ExampleEvent';
  event_namespace: 'docs';
  event_Type: 'ExampleEvent';
  foo: number;
  bar: number;
}

it('Creates an event', () => {
  const created = createEvent<ExampleEvent>(
    'docs',
    'ExampleEvent',
    { foo: 100, bar: 200 },
    undefined,
    () => 'cafebabe-cafe-babe-cafe-babecafebabe'
  );

  expect(created).to.deep.equal({
    id: 'cafebabe-cafe-babe-cafe-babecafebabe',
    data: { ... snip ... },
    context: { ... snip ... }
  });
});
```

This makes unit testing much easier to perform.
*/
export function createEvent<T extends EventData>(
  event_namespace: T["event_namespace"],
  event_type: T["event_type"],
  data: Omit<T, "event_namespace" | "event_type" | "type">,
  context: EventContext<any> = defaultContext(),
  _uuid: () => Uuid = v4,
): Event<T, EventContext<any>> {
  const d = {
    // FIXME: Remove `as object` when TS 3.2 is released, see https://stackoverflow.com/a/53188276/383609
    ...(data as object),
    type: `${event_namespace}.${event_type}`,
    event_type,
    event_namespace,
  };

  return {
    data: d as T,
    context,
    id: _uuid(),
  };
}

/**
Create a context for an event

An event's context consists of a subject (current user or similar), an optional action specifying
what created the event and a creation timestamp.

@param subject - The entity that created this event.
This may be the current user of the platform, or information identifying which server or service
emitted it.

@param action - An identifier describing the source of the event.
This is most commonly the name of an operation like `login` or `inviteMemberToOrganisation`, but can
be any short, clear string.

@param _time - An optional function that returns an ISO8601 date string.
Defaults to the current time. This __should not__ be used in production code, but is very useful
when unit testing code that deals with events. Because the time always changes, created events
cannot be directly tested against expected cases. When testing, override `_time` with an argument
that returns a static string. For example:

```typescript
import { createEvent, EventData } from '@repositive/event-store';

interface ExampleEvent extends EventData {
  type: 'docs.ExampleEvent';
  event_namespace: 'docs';
  event_Type: 'ExampleEvent';
  foo: number;
  bar: number;
}

it('Creates an event', () => {
  const time = '2019-01-01'
  const created = createEvent<ExampleEvent>(
    'docs',
    'ExampleEvent',
    { foo: 100, bar: 200 },
    // Empty subject, no action, overridden time
    createContext({}, undefined, () => time),
    () => 'cafebabe-cafe-babe-cafe-babecafebabe'
  );

  expect(created).to.deep.equal({
    id: 'cafebabe-cafe-babe-cafe-babecafebabe',
    data: { ... snip ... },
    context: { subject: {}, action: '', time }
  });
});
```
*/
export function createContext(
  subject: object,
  action?: string,
  _time: () => IsoDateString = () => new Date().toISOString(),
): EventContext<any> {
  return {
    action,
    subject,
    time: _time(),
  };
}

/**
Check that a given object is valid event data for a given type

This function checks that `type`, `event_namespace` and `event_type` all exist and are strings, then
calls `is` which should be a function that checks that `event_namespace` and `event_type` contain
specific values.
```
*/
export function isEventData<D extends EventData>(
  o: any,
  is?: (o: any) => o is D,
): o is D {
  const _is = is || ((_: any) => true);
  return (
    o &&
    ((typeof o.event_namespace === "string" &&
      typeof o.event_type === "string") ||
      typeof o.type === "string") &&
    _is(o)
  );
}

/**
Check that a given function is a valid event context

An event context must contain *at least* a `time` field.
*/
export function isEventContext<S, C extends EventContext<S>>(
  o: any,
  is?: (o: any) => o is C,
): o is C {
  const _is = is || ((_: any) => true);
  return o && typeof o.time === "string" && _is(o);
}

/**
Check that an object is a complete event

Use this to wrap event matching functions to reduce boilerplate

@param isData - Checks that the object contains a valid event payload. This should have
{@link isEventData} passed to it.

@param isContext - Check that the object contains a valid event context.
For aggregations, this will usually be omitted.
*/
export function isEvent<D extends EventData, C extends EventContext<any>>(
  isData: (o: any) => o is D,
  isContext?: (o: any) => o is C,
): (o: any) => o is Event<D, C> {
  return function(o: any): o is Event<D, C> {
    return (
      o &&
      typeof o.id === "string" &&
      o.data &&
      isEventData(o.data, isData) &&
      o.context &&
      isEventContext(o.context, isContext)
    );
  };
}
