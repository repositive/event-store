import test from 'ava';
import { None } from 'funfix';
import { v4 } from 'uuid';
import * as pino from 'pino';
import { createRedisCacheAdapter } from './redis';
import { CacheEntry } from '../';
import * as redis from 'redis';

const cache_endpoint: string = process.env.REDIS_URI || 'redis://localhost:6380';

// NOTE: Requires Redis cache running locally, start with `docker compose up -d`
test('Set and retrieve Redis cache item', async (t: any) => {
  const cache_id = v4();
  const cache_item: CacheEntry<number> = { time: new Date().toISOString(), data: 100 };

  const redis_client = redis.createClient(cache_endpoint);

  const cache = createRedisCacheAdapter(redis_client, pino());

  await cache.set(cache_id, cache_item);

  const result = await cache.get(cache_id);

  t.deepEqual(result.get(), cache_item);
});

test('Find nonexistent item', async (t: any) => {
  const cache_id = v4();

  const redis_client = redis.createClient(cache_endpoint);

  const cache = createRedisCacheAdapter(redis_client, pino());

  const result = await cache.get(cache_id);

  t.deepEqual(result, None);
});

test('Update cache item', async (t: any) => {
  const cache_id = v4();
  const cache_item: CacheEntry<number> = { time: new Date().toISOString(), data: 100 };

  const redis_client = redis.createClient(cache_endpoint);

  const cache = createRedisCacheAdapter(redis_client, pino());

  await cache.set(cache_id, cache_item);

  const result = (await cache.get(cache_id)).get();

  result.data = 200;

  await cache.set(cache_id, result);

  const updated = await cache.get(cache_id);

  t.deepEqual(updated.get(), { ...cache_item, data: 200 });
});
