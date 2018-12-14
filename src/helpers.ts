import { EventData, EventContext, Event } from '.';
import { v4 } from 'uuid';

function defaultContext(): EventContext<{}> {
  return {
    subject: {},
    time: new Date().toISOString(),
  };
}

export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

export function createEvent<T extends EventData>(
  event_namespace: T["event_namespace"],
  event_type: T["event_type"],
  data: Omit<T, "event_namespace" | "event_type" | "type">,
  context: EventContext<any> = defaultContext(),
  _uuid: () => string = v4,
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

export function createContext(
  subject: object,
  action?: string,
  _time: () => string = () => new Date().toISOString(),
): EventContext<any> {
  return {
    action,
    subject,
    time: _time(),
  };
}

export function isEventData<D extends EventData>(o: any, is?: (o: any) => o is D): o is D {
  const _is = is || ((_: any) => true);
  return (
    o &&
    ((typeof o.event_namespace === 'string' && typeof o.event_type === 'string') ||
      typeof o.type === 'string') &&
    _is(o)
  );
}

export function isEventContext<S, C extends EventContext<S>>(o: any, is?: (o: any) => o is C): o is C {
  const _is = is || ((_: any) => true);
  return o && typeof o.time === 'string' && _is(o);
}

export function isEvent<D extends EventData, C extends EventContext<any>>(
  isData: (o: any) => o is D,
  isContext?: (o: any) => o is C,
): (o: any) => o is Event<D, C> {
  return function(o: any): o is Event<D, C> {
    return o &&
    typeof o.id === 'string' &&
    o.data && isEventData(o.data, isData) &&
    o.context && isEventContext(o.context, isContext);
  };
}
