import {Option, Either} from 'funfix';
import {Event, EventData, EventContext} from '..';

export * from './cache/postgres';
export * from './cache/dumb';
export * from './emitter/amqp';
export * from './emitter/dumb';
export * from './store/postgres';

export interface CacheEntry<T> {
  time?: string; // ISO String
  data: T;
}

export interface CacheAdapter {
  get<T>(id: string): Promise<Option<CacheEntry<T>>>;
  set<T extends CacheEntry<any>>(id: string, obj: T): Promise<void>;
}

export type EmitterHandler<T extends Event<EventData, EventContext<any>>> = (
  event: T,
) => Promise<void>;

export interface EmitterAdapter {
  emit(event: Event<any, any>): Promise<void>;
  subscribe<T extends Event<EventData, EventContext<any>>>(
    name: string,
    handler: EmitterHandler<T>,
  ): void;
}

export interface ReadOptions {
  from?: string;
  to?: string;
}

export interface StoreAdapter<Q> {
  read(query: Q, options: ReadOptions, ...args: any[]): AsyncIterator<Event<EventData, EventContext<any>>>;
  write(data: Event<any, any> | Array<Event<any, any>>): Promise<Either<Error, void>>;
  lastEventOf<E extends Event<any, any>>(eventType: string): Promise<Option<E>>;
  exists(id: string): Promise<boolean>;
  readEventSince(
    eventTYpe: string,
    since?: Option<string>,
  ): AsyncIterator<Event<EventData, EventContext<any>>>;
}
