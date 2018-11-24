import { EventData, EventContext, Event } from '.';
import { v4 } from 'uuid';

function defaultContext(): EventContext<{}> {
  return {
    subject: {},
    time: new Date().toISOString(),
  };
}

export function createEvent(
  event_namespace: string,
  event_type: string,
  data: object,
  context: EventContext<any> = defaultContext(),
  _uuid: () => string = v4,
): Event<EventData, EventContext<any>> {
  const d = {
    ...data,
    type: `${event_namespace}.${event_type}`,
    event_type,
    event_namespace,
  };

  return {
    data: d,
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
  return o && typeof o.event_namespace === 'string' && typeof o.event_type === 'string' && _is(o);
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
