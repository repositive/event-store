import { Option, None } from 'funfix';
import { CacheAdapter, Event, EventData, EventContext, CacheEntry, Logger } from '../../.';
import * as redis from 'redis';

export function createRedisCacheAdapter(logger: Logger = console): CacheAdapter {
  // init code here

  const redis_client = redis.createClient();
  redis_client.on("error", (err) => {
    logger.error("REDIS ERROR");
  });

  async function get<T extends CacheEntry<any>>(id: string): Promise<Option<T>> {
    return Option.of(
      redis_client.get(id) as any,
    );
  }

  function set(id: string, entry: CacheEntry<any>): Promise<void> {
    redis_client.sadd("cache_content", id, (err, operation_return) => {
      if (operation_return === 1) {
        redis_client.set(id, JSON.stringify(entry));
      } else {
        // Do nothing
      }
    });

    return Promise.resolve();
  }

  return {
    get,
    set,
  };
}
