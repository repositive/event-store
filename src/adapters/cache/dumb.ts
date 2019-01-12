import { Option, None } from "funfix";
import { CacheAdapter, CacheEntry, CacheKey } from "../../";

export function createDumbCacheAdapter(): CacheAdapter {
  async function get<T extends CacheEntry<any>>(
    id: CacheKey,
  ): Promise<Option<T>> {
    return None;
  }

  async function set(id: CacheKey, entry: CacheEntry<any>): Promise<void> {
    /* I DO NOT DO ANYTHING */
  }

  return {
    get,
    set,
  };
}
