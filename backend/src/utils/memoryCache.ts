/**
 * High-Performance In-Memory Cache
 * Keeps frequently requested read-heavy data (Settings, Public Stats, Course List) in RAM
 * with configurable TTL and instant invalidation on updates.
 */

interface CacheItem<T> {
  value: T;
  expiresAt: number;
}

class MemoryCache {
  private store = new Map<string, CacheItem<any>>();

  /**
   * Get an item from memory cache. Returns null if expired or missing.
   */
  get<T>(key: string): T | null {
    const item = this.store.get(key);
    if (!item) return null;

    if (Date.now() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return item.value as T;
  }

  /**
   * Store an item in memory cache with TTL in seconds (default 300s / 5 mins)
   */
  set<T>(key: string, value: T, ttlSeconds: number = 300): void {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  /**
   * Delete a specific cache key
   */
  del(key: string): void {
    this.store.delete(key);
  }

  /**
   * Invalidate all keys matching a prefix (e.g. 'settings:')
   */
  invalidatePrefix(prefix: string): void {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Clear all cached items
   */
  flush(): void {
    this.store.clear();
  }
}

export const memoryCache = new MemoryCache();
