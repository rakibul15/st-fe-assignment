interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

interface QueryCacheOptions {
  /** How long cached data is considered fresh (ms). Default: 30s */
  staleTime?: number;
  /** How long cached data is kept before deletion (ms). Default: 5min */
  gcTime?: number;
  /** Max entries before LRU eviction. Default: 50 */
  maxSize?: number;
}

const DEFAULT_STALE_TIME = 30_000;
const DEFAULT_GC_TIME = 5 * 60_000;
const DEFAULT_MAX_SIZE = 50;

export function createQueryCache<T>(options: QueryCacheOptions = {}) {
  const {
    staleTime = DEFAULT_STALE_TIME,
    gcTime = DEFAULT_GC_TIME,
    maxSize = DEFAULT_MAX_SIZE,
  } = options;
  const cache = new Map<string, CacheEntry<T>>();

  function gc() {
    const now = Date.now();
    for (const [key, entry] of cache) {
      if (now - entry.timestamp > gcTime) {
        cache.delete(key);
      }
    }
  }

  function evictLRU() {
    if (cache.size <= maxSize) return;
    // Map preserves insertion order — first key is oldest
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }

  return {
    get(key: string): T | undefined {
      const entry = cache.get(key);
      if (!entry) return undefined;

      // Check if expired beyond gcTime
      if (Date.now() - entry.timestamp > gcTime) {
        cache.delete(key);
        return undefined;
      }

      // Move to end (most recently used) for LRU
      cache.delete(key);
      cache.set(key, entry);
      return entry.data;
    },

    isFresh(key: string): boolean {
      const entry = cache.get(key);
      if (!entry) return false;
      return Date.now() - entry.timestamp < staleTime;
    },

    set(key: string, data: T): void {
      // Remove first to update insertion order
      cache.delete(key);
      cache.set(key, { data, timestamp: Date.now() });
      evictLRU();
    },

    invalidate(key: string): void {
      cache.delete(key);
    },

    clear(): void {
      cache.clear();
    },

    get size(): number {
      gc(); // Only GC on size check, not on every get
      return cache.size;
    },
  };
}

/** Create a stable, collision-safe cache key */
export function createCacheKey(params: Record<string, string | number | undefined>): string {
  const sorted = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== '')
    .sort(([a], [b]) => a.localeCompare(b));
  // Use JSON for collision safety (handles special chars in values)
  return JSON.stringify(sorted);
}
