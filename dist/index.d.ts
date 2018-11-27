import { StoreAdapter } from './adapters';
import { Option } from 'funfix';
import { EventStore, EventStoreOptions } from './event-store';
export { isEvent, createEvent, createContext } from './helpers';
export * from './event-store';
export * from './adapters';
export declare type Aggregator<T> = (acc: Option<T>, event: Event<EventData, any>) => Promise<Option<T>>;
export interface EventData {
    type: string;
    event_namespace: string;
    event_type: string;
}
export interface EventContext<A> {
    action?: string;
    subject: A;
    time: string;
}
export interface Event<D extends EventData, C extends EventContext<any>> {
    id: string;
    data: D;
    context: C;
}
export interface Logger {
    trace(...args: any[]): void;
    debug(...args: any[]): void;
    info(...args: any[]): void;
    warn(...args: any[]): void;
    error(...args: any[]): void;
}
export declare function newEventStore<Q>(store: StoreAdapter<Q>, _options?: EventStoreOptions): Promise<EventStore<Q>>;
