import { Option, None } from "funfix";
import { CacheAdapter, CacheEntry, CacheKey } from "../../";

export function createDumbCacheAdapter(): CacheAdapter {
  async function get<T extends CacheEntry<any>>(_id: CacheKey): Promise<Option<T>> {
    return None;
  }

  async function set(_id: CacheKey, _entry: CacheEntry<any>): Promise<void> {
    /* I DO NOT DO ANYTHING */
  }

  return {
    get,
    set,
  };
}
