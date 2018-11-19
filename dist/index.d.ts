import { Option, Either } from 'funfix';
export { createEvent, createContext } from './helpers';
export * from './adapters';
export declare function reduce<I, O>(iter: AsyncIterator<I>, acc: O, f: (acc: O, next: I) => Promise<O>): Promise<O>;
export declare type Aggregator<T> = (acc: Option<T>, event: Event<EventData, any>) => Promise<Option<T>>;
/**
 *  Compose a list of maching functions into an aggregator
 *
 */
export declare function composeAggregator<T>(matches: AggregateMatches<T>): Aggregator<T>;
export declare function isEvent<D extends EventData, C extends EventContext<any>>(isData?: (o: any) => o is D, isContext?: (o: any) => o is C): (o: any) => o is Event<D, C>;
export interface EventReplayRequested extends EventData {
    type: '_eventstore.EventReplayRequested';
    event_namespace: '_eventstore';
    event_type: 'EventReplayRequested';
    requested_event_type: string;
    requested_event_namespace: string;
    since: string;
}
export declare class DuplicateError extends Error {
}
export interface StoreAdapter<Q> {
    read(query: Q, since: Option<string>, ...args: any[]): AsyncIterator<Event<EventData, EventContext<any>>>;
    write(event: Event<EventData, EventContext<any>>): Promise<Either<DuplicateError, void>>;
    lastEventOf<E extends Event<any, any>>(eventType: string): Promise<Option<E>>;
    readEventSince(eventTYpe: string, since?: Option<string>): AsyncIterator<Event<EventData, EventContext<any>>>;
}
export interface CacheEntry<T> {
    time?: string;
    data: T;
}
export interface CacheAdapter {
    get<T>(id: string): Promise<Option<CacheEntry<T>>>;
    set<T extends CacheEntry<any>>(id: string, obj: T): Promise<void>;
}
export declare type EventHandler<T extends Event<EventData, EventContext<any>>> = (event: T) => Promise<void>;
export interface EmitterAdapter {
    subscriptions: Map<string, EventHandler<any>>;
    emit(event: Event<any, any>): Promise<void>;
    subscribe<T extends Event<EventData, EventContext<any>>>(name: string, handler: EventHandler<T>): void;
    unsubscribe(name: string): void;
}
export interface EventData {
    type: string;
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
export declare type Aggregate<A extends any[], T> = (...args: A) => Promise<Option<T>>;
export declare type ValidateF<E extends Event<any, any>> = (o: any) => o is E;
export declare type ExecuteF<T, E extends Event<any, any>> = (acc: Option<T>, ev: E) => Promise<Option<T>>;
export declare type AggregateMatch<A, T extends Event<any, any>> = [ValidateF<T>, ExecuteF<A, T>];
export declare type AggregateMatches<T> = Array<AggregateMatch<T, any>>;
export interface EventStore<Q> {
    save(event: Event<EventData, EventContext<any>>): Promise<void>;
    createAggregate<A extends any[], T>(aggregateName: string, query: Q, matches: AggregateMatches<T>): Aggregate<A, T>;
    listen<T extends string>(event_namespace: string, event_type: string, handler: EventHandler<Event<{
        type: T;
    }, any>>): void;
}
export interface Logger {
    trace(...args: any[]): void;
    debug(...args: any[]): void;
    info(...args: any[]): void;
    warn(...args: any[]): void;
    error(...args: any[]): void;
}
export interface EventStoreOptions {
    cache?: CacheAdapter;
    emitter?: EmitterAdapter;
    logger?: Logger;
}
export declare function newEventStore<Q>(store: StoreAdapter<Q>, _options?: EventStoreOptions): Promise<EventStore<Q>>;
export declare function createEventReplayHandler({ store, emitter, }: {
    store: StoreAdapter<any>;
    emitter: EmitterAdapter;
}): (event: Event<EventReplayRequested, EventContext<any>>) => Promise<void>;
