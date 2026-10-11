import rateLimit from 'express-rate-limit';

/**
 * Strict rate limiter for authentication routes (login, credential checks)
 * Thwarts brute-force attacks and credential stuffing
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 15 : 100, // Limit failed login requests per IP
  skipSuccessfulRequests: true, // Legitimate logins do not consume the brute-force threshold
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP. Please try again after 15 minutes.'
  }
});

/**
 * Rate limiter for public verification endpoints (QR scan / student lookup)
 */
export const publicVerifyLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // Limit each IP to 60 verification requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Verification rate limit exceeded. Please wait a moment before trying again.'
  }
});

/**
 * Registration rate limiter to prevent automated mass-account creation
 */
export const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 center registrations per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many registration requests from this IP. Please try again later.'
  }
});

/**
 * General API rate limiter
 */
export const generalApiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 300, // 300 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests. Please slow down.'
  }
});
