import { Option, None } from 'funfix';
import { CacheAdapter, CacheEntry, Logger } from '../../.';
import { RedisClient } from 'redis';

export { ClientOpts as RedisClientOptions } from 'redis';

export function createRedisCacheAdapter(
  redis_client: RedisClient,
  logger: Logger = console,
): CacheAdapter {
  async function get<T extends CacheEntry<any>>(id: string): Promise<Option<T>> {
    logger.trace({ id }, 'eventStoreRedisCacheQuery');

    try {
      const result: string = await new Promise((resolve, reject) =>
        redis_client.hget('aggregate_cache', id, (err: Error, item: string) =>
          err ? reject(err) : resolve(item),
        ),
      );

      const opt: Option<T> = Option.of(result).map((res: string): T => JSON.parse(res));

      logger.trace(opt, 'eventStoreRedisCacheResponse');

      return opt;
    } catch (e) {
      logger.error(e.stack, 'eventStoreRedisCacheGetError');

      return None;
    }
  }

  async function set(id: string, entry: CacheEntry<any>): Promise<void> {
    logger.trace({ id, entry }, 'eventStoreRedisCacheSet');

    try {
      await new Promise((resolve, reject) =>
        redis_client.hset(
          'aggregate_cache',
          id,
          JSON.stringify(entry),
          (err: Error, operation_return: number) => (err ? reject(err) : resolve(operation_return)),
        ),
      );
    } catch (e) {
      logger.error(e.stack, 'eventStoreRedisCacheSetError');
    }
  }

  return {
    get,
    set,
  };
}
