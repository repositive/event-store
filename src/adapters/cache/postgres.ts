import { Pool } from "pg";
import { Option, None } from "funfix";
import {
  CacheAdapter,
  Event,
  EventData,
  EventContext,
  CacheEntry,
  CacheKey,
  Logger,
} from "../../.";

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

export function createPgCacheAdapter(
  pool: Pool,
  logger: Logger = console,
): CacheAdapter {
  pool.query(aggregateCacheTable).catch((error) => {
    logger.error("Error creating cache table", error);
    throw error;
  });

  async function get<T extends CacheEntry<any>>(
    id: CacheKey,
  ): Promise<Option<T>> {
    const query = {
      text: `SELECT * from aggregate_cache where id = $1`,
      values: [id],
    };
    logger.trace("execute query", query);
    const result = await pool.query(query);
    logger.trace("db response", result);
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
