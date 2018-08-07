import { Pool } from 'pg';
import { Option, None } from 'funfix';
import { CacheAdapter, Event, EventData, EventContext, CacheEntry } from '../../.';

const upsertAggregateCache = `
  INSERT INTO aggregate_cache (id, data, time)
  VALUES ($1, $2, $3)
  ON CONFLICT (id)
  DO UPDATE SET data = $2, time = now();
`;

const aggregateCacheTable = `
  CREATE TABLE IF NOT EXISTS aggregate_cache(
    id VARCHAR(64) NOT NULL,
    data JSONB NOT NULL,
    time TIMESTAMP DEFAULT now(),
    PRIMARY KEY(id, aggregate_type)
  );
`;

export default function getAdapter(pool: Pool): CacheAdapter {

  pool.query(aggregateCacheTable)
    .catch((error) => {
      throw error;
    });

  async function get<T extends CacheEntry<any>>(id: string): Promise<Option<T>> {
    const result = await pool.query(`SELECT * from aggregate_cache where id = $1`, [id]);
    return Option.of(result.rows[0]);
  }

  async function set(id: string, entry: CacheEntry<any>): Promise<void> {
    await pool.query(upsertAggregateCache, [id, entry]);
  }

  return {
    get,
    set,
  };
}
