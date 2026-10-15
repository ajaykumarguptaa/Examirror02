import Redis from 'ioredis';

interface CacheItem<T> {
  value: T;
  expiresAt: number;
}

/**
 * Enterprise Dual-Layer Hybrid Cache (L1 Memory + L2 Redis)
 * 
 * L1: Instant (0.01ms) In-Memory Store
 * L2: Centralized Redis Shared Cache across cluster workers / VPS instances
 * Fail-Safe: If Redis is offline or not configured, seamlessly runs on L1 memory without throwing errors.
 */
class HybridCache {
  private localStore = new Map<string, CacheItem<any>>();
  private redisClient: Redis | null = null;
  private isConnected = false;
  private isConnecting = false;

  constructor() {
    this.initRedis();
  }

  private initRedis() {
    const redisUrl = process.env.REDIS_URL || process.env.REDIS_URI;
    const redisHost = process.env.REDIS_HOST;

    if (!redisUrl && !redisHost) {
      console.log('[Cache] Running in local high-speed in-memory mode (L1). Set REDIS_URL to enable distributed Redis (L2).');
      return;
    }

    try {
      this.isConnecting = true;
      const options = {
        retryStrategy: (times: number) => {
          if (times > 5) {
            console.warn('[Cache] Redis retry limit reached. Falling back safely to L1 memory.');
            return null; // stop retrying
          }
          return Math.min(times * 1000, 3000);
        },
        maxRetriesPerRequest: 1,
        enableOfflineQueue: false,
        connectTimeout: 4000
      };

      if (redisUrl) {
        this.redisClient = new Redis(redisUrl, options);
      } else {
        this.redisClient = new Redis({
          host: redisHost || '127.0.0.1',
          port: Number(process.env.REDIS_PORT) || 6379,
          password: process.env.REDIS_PASSWORD || undefined,
          ...options
        });
      }

      this.redisClient.on('connect', () => {
        this.isConnected = true;
        this.isConnecting = false;
        console.log('[Cache] Connected successfully to Redis. Distributed L1/L2 caching active.');
      });

      this.redisClient.on('error', (err) => {
        this.isConnected = false;
        if (this.isConnecting) {
          console.warn('[Cache] Redis notice (operating on local in-memory fallback):', err.message);
          this.isConnecting = false;
        }
      });

      this.redisClient.on('close', () => {
        this.isConnected = false;
      });
    } catch (err: any) {
      console.warn('[Cache] Failed to initialize Redis. Using local memory fallback:', err.message);
      this.isConnected = false;
    }
  }

  /**
   * Get an item from cache. Checks L1 (Memory) first, then L2 (Redis).
   */
  async get<T>(key: string): Promise<T | null> {
    // 1. Check L1 Memory (0.01ms)
    const local = this.localStore.get(key);
    if (local) {
      if (Date.now() <= local.expiresAt) {
        return local.value as T;
      }
      this.localStore.delete(key);
    }

    // 2. Check L2 Redis (if active)
    if (this.isConnected && this.redisClient) {
      try {
        const raw = await this.redisClient.get(key);
        if (raw !== null) {
          const parsed = JSON.parse(raw) as T;
          // Populate L1 cache for subsequent fast reads
          this.localStore.set(key, {
            value: parsed,
            expiresAt: Date.now() + 60 * 1000
          });
          return parsed;
        }
      } catch (_) {
        // Fail-safe fallback
      }
    }

    return null;
  }

  /**
   * Synchronous L1 lookup for legacy non-async readers
   */
  getSync<T>(key: string): T | null {
    const local = this.localStore.get(key);
    if (local) {
      if (Date.now() <= local.expiresAt) {
        return local.value as T;
      }
      this.localStore.delete(key);
    }
    return null;
  }

  /**
   * Set an item in cache. Writes to both L1 and L2 with TTL.
   */
  async set<T>(key: string, value: T, ttlSeconds: number = 300): Promise<void> {
    // 1. Write to L1 Memory
    this.localStore.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000
    });

    // 2. Write to L2 Redis
    if (this.isConnected && this.redisClient) {
      try {
        const serialized = JSON.stringify(value);
        await this.redisClient.set(key, serialized, 'EX', ttlSeconds);
      } catch (_) {
        // Fail-safe
      }
    }
  }

  /**
   * Delete a specific cache key from both L1 and L2.
   */
  async del(key: string): Promise<void> {
    this.localStore.delete(key);
    if (this.isConnected && this.redisClient) {
      try {
        await this.redisClient.del(key);
      } catch (_) {}
    }
  }

  /**
   * Non-blocking prefix invalidation using Redis SCAN (Enterprise pattern)
   */
  async invalidatePrefix(prefix: string): Promise<void> {
    // 1. Invalidate L1
    for (const key of this.localStore.keys()) {
      if (key.startsWith(prefix)) {
        this.localStore.delete(key);
      }
    }

    // 2. Non-blocking Invalidate L2 Redis
    if (this.isConnected && this.redisClient) {
      try {
        let cursor = '0';
        do {
          const [nextCursor, keys] = await this.redisClient.scan(cursor, 'MATCH', `${prefix}*`, 'COUNT', 100);
          cursor = nextCursor;
          if (keys.length > 0) {
            await this.redisClient.del(...keys);
          }
        } while (cursor !== '0');
      } catch (_) {}
    }
  }

  /**
   * Clear all cached items
   */
  async flush(): Promise<void> {
    this.localStore.clear();
    if (this.isConnected && this.redisClient) {
      try {
        await this.redisClient.flushdb();
      } catch (_) {}
    }
  }

  /**
   * Diagnostics & Health Stats
   */
  getHealth(): { status: string; l1Entries: number; l2RedisActive: boolean } {
    return {
      status: 'healthy',
      l1Entries: this.localStore.size,
      l2RedisActive: this.isConnected
    };
  }
}

export const hybridCache = new HybridCache();
export const memoryCache = hybridCache;
