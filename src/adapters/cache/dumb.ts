import { Option, None } from 'funfix';
import { CacheAdapter, CacheEntry } from '../../';

export function createDumbCacheAdapter(): CacheAdapter {

  async function get<T extends CacheEntry<any>>(id: string): Promise<Option<T>> {
    return None;
  }

  async function set(id: string, entry: CacheEntry<any>): Promise<void> {
    /* I DO NOT DO ANYTHING */
  }

  return {
    get,
    set,
  };
}
