import { Event, EventData, EventContext, StoreAdapter, CacheAdapter, EmitterAdapter, Logger, Aggregator } from '.';
import { Option, Either } from 'funfix';
export declare type Aggregate<A extends any[], T> = (...args: A) => Promise<Option<T>>;
export declare type ValidateF<E extends Event<any, any>> = (o: any) => o is E;
export declare type ExecuteF<T, E extends Event<any, any>> = (acc: Option<T>, ev: E) => Promise<Option<T>>;
export declare type AggregateMatch<A, T extends Event<any, any>> = [ValidateF<T>, ExecuteF<A, T>];
export declare type AggregateMatches<T> = Array<AggregateMatch<T, any>>;
export declare type EventHandler<Q, T extends Event<EventData, EventContext<any>>> = (event: T, store: EventStore<Q>) => Promise<Either<undefined, undefined>>;
export interface EventStoreOptions {
    cache?: CacheAdapter;
    emitter?: EmitterAdapter;
    logger?: Logger;
}
export declare class EventStore<Q> {
    private store;
    private cache;
    private emitter;
    private logger;
    constructor(store_adapter: StoreAdapter<Q>, options?: EventStoreOptions);
    save(event: Event<EventData, EventContext<any>>): Promise<void>;
    createAggregate<A extends any[], T>(aggregateName: string, query: Q, matches: AggregateMatches<T>): Aggregate<A, T>;
    listen<T extends EventData>(event_namespace: T['event_namespace'], event_type: T['event_type'], handler: EventHandler<Q, any>): Promise<void>;
}
export interface EventReplayRequested extends EventData {
    type: '_eventstore.EventReplayRequested';
    event_namespace: '_eventstore';
    event_type: 'EventReplayRequested';
    requested_event_type: string;
    requested_event_namespace: string;
    since: string;
}
export declare function reduce<I, O>(iter: AsyncIterator<I>, acc: O, f: (acc: O, next: I) => Promise<O>): Promise<O>;
/**
 *  Compose a list of maching functions into an aggregator
 *
 */
export declare function composeAggregator<T>(matches: AggregateMatches<T>): Aggregator<T>;
export declare function createEventReplayHandler({ store, emitter, }: {
    store: StoreAdapter<any>;
    emitter: EmitterAdapter;
}): (event: Event<EventReplayRequested, EventContext<any>>) => Promise<void>;
