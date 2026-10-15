import { Request, Response, NextFunction } from 'express';

interface BucketState {
  tokens: number;
  lastRefill: number;    // Milliseconds timestamp
  lastAccessed: number;  // Milliseconds timestamp for TTL cleanup
}

export interface TokenBucketOptions {
  /** Maximum capacity of the bucket (maximum burst allowance) */
  capacity: number;
  /** Number of tokens replenished per second */
  refillRate: number;
  /** Cost per request (default: 1) or a dynamic function */
  cost?: number | ((req: Request) => number);
  /** Custom key generator (default: IP address with optional auth token isolation) */
  keyGenerator?: (req: Request) => string;
  /** Custom message or JSON payload when limit is exceeded */
  message?: string | Record<string, any>;
  /** Optional function to bypass rate limiting (e.g. OPTIONS preflights) */
  skip?: (req: Request) => boolean;
  /** When true, successful requests (< 400) do not consume tokens (great for login brute-force protection) */
  skipSuccessfulRequests?: boolean;
  /** Bucket idle TTL in milliseconds before in-memory garbage collection (default: 15 mins) */
  ttlMs?: number;
}

/**
 * Creates a high-performance, burst-tolerant Token Bucket Rate Limiting middleware.
 * Uses O(1) in-memory bucket states with automatic periodic TTL garbage collection.
 */
export const createTokenBucketLimiter = (options: TokenBucketOptions) => {
  const {
    capacity,
    refillRate,
    cost = 1,
    message = 'Too many requests. Rate limit exceeded (Token Bucket). Please slow down.',
    skip,
    skipSuccessfulRequests = false,
    ttlMs = 15 * 60 * 1000 // 15 minutes TTL
  } = options;

  const buckets = new Map<string, BucketState>();

  // Default key generator: extracts remote IP and isolates bearer tokens for NAT networks
  const defaultKeyGenerator = (req: Request): string => {
    const forwarded = req.headers['x-forwarded-for'];
    let ip = '';
    if (typeof forwarded === 'string') {
      ip = forwarded.split(',')[0].trim();
    } else if (Array.isArray(forwarded) && forwarded.length > 0) {
      ip = forwarded[0].trim();
    } else {
      ip = req.ip || req.socket?.remoteAddress || '127.0.0.1';
    }

    const auth = req.headers.authorization;
    if (auth && auth.startsWith('Bearer ')) {
      // Isolate different logged-in users sharing the same public IP
      const tokenTail = auth.slice(-16);
      return `${ip}:${tokenTail}`;
    }

    return ip;
  };

  const keyGen = options.keyGenerator || defaultKeyGenerator;

  // Periodic garbage collection to prevent memory leaks from one-off IP addresses
  const gcInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, state] of buckets.entries()) {
      if (now - state.lastAccessed > ttlMs) {
        buckets.delete(key);
      }
    }
  }, Math.max(60000, ttlMs / 3));

  if (gcInterval.unref) {
    gcInterval.unref(); // Do not prevent Node process shutdown
  }

  return (req: Request, res: Response, next: NextFunction) => {
    // 1. Skip preflight CORS requests or user-defined bypass
    if (req.method === 'OPTIONS') return next();
    if (skip && skip(req)) return next();

    const key = keyGen(req);
    const now = Date.now();
    const costAmount = typeof cost === 'function' ? cost(req) : cost;

    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = {
        tokens: capacity,
        lastRefill: now,
        lastAccessed: now
      };
      buckets.set(key, bucket);
    }

    // 2. Refill tokens according to elapsed time
    const elapsedSeconds = (now - bucket.lastRefill) / 1000;
    bucket.tokens = Math.min(capacity, bucket.tokens + elapsedSeconds * refillRate);
    bucket.lastRefill = now;
    bucket.lastAccessed = now;

    // 3. Check token availability
    if (bucket.tokens >= costAmount) {
      bucket.tokens -= costAmount;

      const remainingTokens = Math.max(0, Math.floor(bucket.tokens));
      const timeToFull = Math.ceil((capacity - bucket.tokens) / refillRate);

      // Set standard RateLimit headers (IETF RFC Draft + Legacy X-RateLimit)
      res.setHeader('X-RateLimit-Limit', capacity);
      res.setHeader('X-RateLimit-Remaining', remainingTokens);
      res.setHeader('X-RateLimit-Reset', timeToFull);
      res.setHeader('RateLimit-Policy', `${capacity};w=1;burst=${capacity}`);
      res.setHeader('RateLimit-Limit', capacity);
      res.setHeader('RateLimit-Remaining', remainingTokens);
      res.setHeader('RateLimit-Reset', timeToFull);

      // Refund consumed token if request succeeded and skipSuccessfulRequests is enabled
      if (skipSuccessfulRequests) {
        res.on('finish', () => {
          if (res.statusCode < 400) {
            const currentBucket = buckets.get(key);
            if (currentBucket) {
              currentBucket.tokens = Math.min(capacity, currentBucket.tokens + costAmount);
            }
          }
        });
      }

      return next();
    } else {
      // 4. Rate limit exceeded (Token Bucket is empty)
      const missingTokens = costAmount - bucket.tokens;
      const retryAfterSeconds = Math.max(1, Math.ceil(missingTokens / refillRate));

      res.setHeader('Retry-After', retryAfterSeconds);
      res.setHeader('X-RateLimit-Limit', capacity);
      res.setHeader('X-RateLimit-Remaining', 0);
      res.setHeader('X-RateLimit-Reset', retryAfterSeconds);
      res.setHeader('RateLimit-Limit', capacity);
      res.setHeader('RateLimit-Remaining', 0);
      res.setHeader('RateLimit-Reset', retryAfterSeconds);

      const responsePayload = typeof message === 'string'
        ? { success: false, message, retryAfterSeconds, algorithm: 'token-bucket' }
        : { ...message, retryAfterSeconds, algorithm: 'token-bucket' };

      return res.status(429).json(responsePayload);
    }
  };
};

/**
 * 1. General API Token Bucket Limiter
 * Capacity: 150 tokens (burst limit for multi-endpoint SPA initial load)
 * Refill Rate: 10 tokens/sec (600 requests per minute sustained throughput)
 */
export const generalApiLimiter = createTokenBucketLimiter({
  capacity: 150,
  refillRate: 10,
  message: {
    success: false,
    message: 'Too many API requests. Rate limit exceeded. Please wait a moment.'
  }
});

/**
 * 2. Authentication Token Bucket Limiter
 * Protects login endpoints against credential stuffing and brute-force attacks.
 * Capacity: 10 attempts burst
 * Refill Rate: 0.2 tokens/sec (1 token refilled every 5 seconds)
 * Successful logins (< 400) are refunded, so genuine users are never blocked.
 */
export const authRateLimiter = createTokenBucketLimiter({
  capacity: 5,
  refillRate: 5 / (15 * 60), // 5 tokens refilled over 15 minutes (0.0055 tokens/sec)
  skipSuccessfulRequests: true, // Only failed attempts (4xx/5xx) consume tokens
  ttlMs: 20 * 60 * 1000,
  message: {
    success: false,
    message: 'Too many failed login attempts. For security reasons, your IP has been temporarily restricted. Please try again after 15 minutes.'
  }
});

/**
 * 3. Public Student / Certificate Verification Limiter
 * Capacity: 40 tokens burst (for rapid QR scans or multi-tab verification)
 * Refill Rate: 2 tokens/sec (120 verifications per minute sustained)
 */
export const publicVerifyLimiter = createTokenBucketLimiter({
  capacity: 25, // Max burst of 25 verifications
  refillRate: 0.5, // 1 token every 2 seconds (30 reqs/min) to thwart automated scraping
  message: {
    success: false,
    message: 'Too many verification attempts from your IP. Please wait a moment before trying again.'
  }
});

/**
 * 4. Center & Franchise Registration Limiter
 * Capacity: 5 tokens burst
 * Refill Rate: 0.05 tokens/sec (1 token replenished every 20 seconds)
 */
export const registrationLimiter = createTokenBucketLimiter({
  capacity: 5,
  refillRate: 0.05,
  message: {
    success: false,
    message: 'Too many registration requests. Please wait before submitting again.'
  }
});
