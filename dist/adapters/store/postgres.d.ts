import { Pool } from "pg";
import { StoreAdapter } from "../../.";
import { Logger } from "../../.";
export interface PgQuery {
    text: string;
    values?: any[];
}
export declare function createPgStoreAdapter(pool: Pool, logger?: Logger): StoreAdapter<PgQuery>;
