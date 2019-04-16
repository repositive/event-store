import test from "ava";
import { v4 } from 'uuid';
import * as pino from 'pino';
import {
  createRedisCacheAdapter
} from "./redis";
import { CacheEntry } from '../';

const cache_endpoint: string = process.env.REDIS_URI || 'redis://localhost:6380';

// NOTE: Requires Redis cache running locally, start with `docker compose up -d`
test("Set and retrieve Redis cache item", async (t: any) => {
  const cache_id = v4();
  const cache_item: CacheEntry<number> = { time: new Date().toISOString(), data: 100 };

  const cache = createRedisCacheAdapter(cache_endpoint, pino());

  await cache.set(cache_id, cache_item);

  const result = await(cache.get(cache_id));

  t.deepEqual(result.get(), cache_item);
});
