import { Option, None } from 'funfix';
import { CacheAdapter, Event, EventData, EventContext, CacheEntry, Logger } from '../../.';
import * as redis from 'redis';

export function createRedisCacheAdapter(redis_client: any, logger: Logger = console): CacheAdapter {
  async function get<T extends CacheEntry<any>>(id: string): Promise<Option<T>> {
    return Option.of(
      JSON.parse(redis_client.get(id) as any),
    );
  }

  function set(id: string, entry: CacheEntry<any>): Promise<void> {
    redis_client.sadd("cache_content", id, (err: any, operation_return: any) => {
      if (operation_return === 1) {
        redis_client.set(id, JSON.stringify(entry));
      }
    });
    return Promise.resolve();
  }

  return {
    get,
    set,
  };
}
