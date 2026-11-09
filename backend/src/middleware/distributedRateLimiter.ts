import { Response, NextFunction } from 'express';
import { AuthenticatedPartnerRequest } from './partnerAuth.js';
import { GLOBAL_CONSTANTS } from '../config/globalConstants.js';

interface RateLimitBucket {
  tokens: number;
  lastRefillTimestamp: number;
}

const rateLimitBuckets = new Map<string, RateLimitBucket>();

export function distributedRateLimiter(defaultRpm: number = GLOBAL_CONSTANTS.SECURITY.DEFAULT_PARTNER_RATE_LIMIT_RPM) {
  return (req: AuthenticatedPartnerRequest, res: Response, next: NextFunction): void => {
    const identifier = req.partner?.apiKey || req.ip || 'anonymous-client';
    const capacity = req.partner?.rateLimitRpm || defaultRpm;
    const refillRatePerSecond = capacity / 60;

    const now = Date.now();
    let bucket = rateLimitBuckets.get(identifier);

    if (!bucket) {
      bucket = { tokens: capacity, lastRefillTimestamp: now };
      rateLimitBuckets.set(identifier, bucket);
    } else {

      const elapsedSeconds = (now - bucket.lastRefillTimestamp) / 1000;
      const tokensToAdd = elapsedSeconds * refillRatePerSecond;
      bucket.tokens = Math.min(capacity, bucket.tokens + tokensToAdd);
      bucket.lastRefillTimestamp = now;
    }

    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      res.setHeader('X-RateLimit-Limit', capacity.toString());
      res.setHeader('X-RateLimit-Remaining', Math.floor(bucket.tokens).toString());
      next();
    } else {
      const missingTokens = 1 - bucket.tokens;
      const retryAfterSec = Math.ceil(missingTokens / refillRatePerSecond);

      res.setHeader('Retry-After', retryAfterSec.toString());
      res.setHeader('X-RateLimit-Limit', capacity.toString());
      res.setHeader('X-RateLimit-Remaining', '0');

      res.status(429).json({
        error: 'Too Many Requests',
        message: `Rate limit quota exceeded (${capacity} requests/min). Please back off and retry after ${retryAfterSec} seconds.`,
        retryAfterSeconds: retryAfterSec
      });
    }
  };
}
