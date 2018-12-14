import { EventData, EventContext, Event } from '.';
export declare type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
export declare function createEvent<T extends EventData>(event_namespace: T['event_namespace'], event_type: T['event_type'], data: Omit<T, 'event_namespace' | 'event_type' | 'type'>, context?: EventContext<any>, _uuid?: () => string): Event<T, EventContext<any>>;
export declare function createContext(subject: object, action?: string, _time?: () => string): EventContext<any>;
export declare function isEventData<D extends EventData>(o: any, is?: (o: any) => o is D): o is D;
export declare function isEventContext<S, C extends EventContext<S>>(o: any, is?: (o: any) => o is C): o is C;
export declare function isEvent<D extends EventData, C extends EventContext<any>>(isData: (o: any) => o is D, isContext?: (o: any) => o is C): (o: any) => o is Event<D, C>;
