import { EventData, EventContext, Event } from '.';
export declare function createEvent(event_namespace: string, event_type: string, data: object, context?: EventContext<any>, _uuid?: () => string): Event<EventData, EventContext<any>>;
export declare function createContext(subject: object, action?: string, _time?: () => string): EventContext<any>;
