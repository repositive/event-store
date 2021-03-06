import { Pool } from "pg";
import { Option } from "funfix";
import { CacheAdapter, CacheEntry, CacheKey, Logger } from "../../.";

const insertAggregateCache = `
  INSERT INTO aggregate_cache (id, data, time)
  VALUES ($1, $2, $3)
  ON CONFLICT (id)
  DO UPDATE SET data = EXCLUDED.data, time = EXCLUDED.time;
`;

const aggregateCacheTable = `
  CREATE TABLE IF NOT EXISTS aggregate_cache(
    id VARCHAR(64) NOT NULL,
    data JSONB NOT NULL,
    time VARCHAR(24),
    PRIMARY KEY(id)
  );
`;

export function createPgCacheAdapter(pool: Pool, logger: Logger = console): CacheAdapter {
  pool.query(aggregateCacheTable).catch((error) => {
    logger.error(error, "eventStoreCacheTableCreateError");
    throw error;
  });

  async function get<T extends CacheEntry<any>>(id: CacheKey): Promise<Option<T>> {
    const query = {
      text: `SELECT * from aggregate_cache where id = $1`,
      values: [id],
    };
    logger.trace({ query }, "eventStoreAggregateCacheQuery");
    const result = await pool.query(query);
    logger.trace(result, "eventStoreAggregateCacheResponse");
    return Option.of(result.rows[0]);
  }

  function set(id: CacheKey, entry: CacheEntry<any>): Promise<void> {
    return pool
      .query(insertAggregateCache, [id, JSON.stringify(entry.data), entry.time])
      .then(() => {
        /**/
      });
  }

  return {
    get,
    set,
  };
}
