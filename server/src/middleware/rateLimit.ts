// ============================================================
// Rate Limiting Middleware (Redis-backed)
// ============================================================

import { Request, Response, NextFunction } from 'express';
import redis from '../config/redis';

/**
 * Rate limit middleware factory using Redis INCR + EXPIRE.
 *
 * @param windowMs - Time window in milliseconds
 * @param maxRequests - Maximum requests allowed within the window
 */
export function rateLimit(windowMs: number, maxRequests: number) {
  const windowSeconds = Math.ceil(windowMs / 1000);

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const identifier = req.userId || req.ip || 'unknown';
      const route = req.baseUrl + req.path;
      const key = `ratelimit:${identifier}:${route}`;

      const pipeline = redis.pipeline();
      pipeline.incr(key);
      pipeline.expire(key, windowSeconds);
      const results = await pipeline.exec();

      if (!results || !results[0]) {
        // Redis unavailable - fail open to avoid blocking users
        next();
        return;
      }

      const currentCount = results[0][1] as number;

      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - currentCount));
      res.setHeader('X-RateLimit-Reset', Math.ceil(Date.now() / 1000) + windowSeconds);

      if (currentCount > maxRequests) {
        res.status(429).json({
          success: false,
          message: 'Too many requests, please try again later',
        });
        return;
      }

      next();
    } catch (err) {
      // Fail open - if Redis is down, don't block the request
      console.error('[RateLimit] Redis error, failing open:', (err as Error).message);
      next();
    }
  };
}

// ---- Presets ----

/** General API rate limit: 1000 requests per 15 minutes (map apps need high limits) */
export const apiLimiter = rateLimit(15 * 60 * 1000, 1000);

/**
 * Auth endpoints rate limit: 40 requests per 15 minutes per IP.
 * Per-IP brute-force protection; per-ACCOUNT brute force is separately capped
 * by the login_fails lockout (>5 failed attempts → 15 min). 10 was too low for
 * a human fumbling a password a few times, so raised to a forgiving 40.
 */
export const authLimiter = rateLimit(15 * 60 * 1000, 40);

/** Upload/claim rate limit: 20 requests per hour */
export const uploadLimiter = rateLimit(60 * 60 * 1000, 20);

/** Claim/route submission rate limit: 5 per minute */
export const claimLimiter = rateLimit(60 * 1000, 5);

/** Echo creation rate limit: 10 per minute */
export const echoLimiter = rateLimit(60 * 1000, 10);
