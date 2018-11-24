import { Pool } from 'pg';
import * as R from 'ramda';
import { StoreAdapter } from './adapters';
import { Future, Option, None, Either, Left, Right } from 'funfix';
import { EventStore, EventStoreOptions } from './event-store';
export { isEvent, createEvent, createContext } from './helpers';
export * from './event-store';
export * from './adapters';
import { createDumbCacheAdapter, createDumbEmitterAdapter } from './adapters';

export type Aggregator<T> = (acc: Option<T>, event: Event<EventData, any>) => Promise<Option<T>>;

export interface EventData {
  type: string;
  event_namespace: string;
  event_type: string;
}

export interface EventContext<A> {
  action?: string;
  subject: A;
  time: string; // ISO TIMESTAMP String
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

export async function newEventStore<Q>(
  store: StoreAdapter<Q>,
  _options?: EventStoreOptions,
): Promise<EventStore<Q>> {
  const options = _options || {};
  const { logger = console } = options;
  logger.warn(`
    DEPRECATED WARNING!\n
    The newEventStore function is deprecated and will be remove in a future version of the store.\n
    Use the EventStore class instead.
  `);
  return new EventStore(store, _options);
}
