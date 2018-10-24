import { EventData, EventContext, Event } from '.';
import { v4 } from 'uuid';

function defaultContext(): EventContext<{}> {
  return {
    subject: {},
    time: new Date().toISOString(),
  };
}

export function createEvent<D extends EventData>(
  event_namespace: string,
  event_type: string,
  data: D,
  context: EventContext<any> = defaultContext(),
  _uuid: () => string = v4,
): Event<EventData, EventContext<any>> {
  const d = {
    ...(data as object),
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
