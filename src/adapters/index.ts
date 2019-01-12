import {Option, Either} from 'funfix';
import {Event, EventData, EventContext} from '..';

export * from './cache/postgres';
export * from './cache/dumb';
export * from './emitter/amqp';
export * from './emitter/dumb';
export * from './store/postgres';

export interface CacheEntry<T> {
  time: string;
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
    name: T["data"]["type"],
    handler: EmitterHandler<T>,
  ): void;
}

export class DuplicateError extends Error {}
export interface StoreAdapter<Q> {
  read(query: Q, since: Option<string>, ...args: any[]): AsyncIterator<Event<EventData, EventContext<any>>>;
  write(event: Event<EventData, EventContext<any>>): Promise<Either<DuplicateError, void>>;
  lastEventOf<E extends Event<any, any>>(eventType: string): Promise<Option<E>>;
  exists(id: string): Promise<boolean>;
  readEventSince(
    eventTYpe: string,
    since?: Option<string>,
  ): AsyncIterator<Event<EventData, EventContext<any>>>;
}
