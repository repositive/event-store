import { Pool } from 'pg';
import { CacheAdapter, Logger } from '../../.';
export declare function createPgCacheAdapter(pool: Pool, logger?: Logger): CacheAdapter;
