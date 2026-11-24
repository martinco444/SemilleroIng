import type { Request, Response, NextFunction, RequestHandler } from 'express';

const INSTITUTIONAL_EMAIL_REGEX = /^[a-z0-9._%+-]+@(?:correo\.)?usbcali\.edu\.co$/i;

export function isInstitutionalEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  return normalized.length <= 160 && INSTITUTIONAL_EMAIL_REGEX.test(normalized);
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim().length > 0) {
    return forwarded.split(',')[0].trim();
  }
  if (Array.isArray(forwarded) && forwarded.length > 0) {
    return forwarded[0].trim();
  }
  return req.ip || req.socket.remoteAddress || 'unknown';
}

export function securityHeaders(_req: Request, res: Response, next: NextFunction): void {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  next();
}

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

interface RateLimiterOptions {
  windowMs: number;
  maxRequests: number;
  keyPrefix: string;
  message: string;
  keyGenerator?: (req: Request) => string;
}

const MAX_BUCKETS = 10_000;

export function createRateLimiter(options: RateLimiterOptions): RequestHandler {
  const buckets = new Map<string, RateLimitBucket>();

  // Prune expired buckets periodically without blocking Node shutdown
  const cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt <= now) {
        buckets.delete(key);
      }
    }
  }, Math.min(options.windowMs, 5 * 60 * 1000));
  cleanupTimer.unref();

  return (req: Request, res: Response, next: NextFunction): void => {
    const now = Date.now();
    const rawKey = options.keyGenerator ? options.keyGenerator(req) : getClientIp(req);
    const key = `${options.keyPrefix}:${rawKey}`;

    if (buckets.size >= MAX_BUCKETS && !buckets.has(key)) {
      for (const [existingKey, existingBucket] of buckets) {
        if (existingBucket.resetAt <= now) {
          buckets.delete(existingKey);
        }
      }
      if (buckets.size >= MAX_BUCKETS) {
        const oldestKey = buckets.keys().next().value;
        if (oldestKey) buckets.delete(oldestKey);
      }
    }

    let bucket = buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + options.windowMs };
      buckets.set(key, bucket);
    }

    bucket.count += 1;
    const remaining = Math.max(0, options.maxRequests - bucket.count);
    const retryAfterSec = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));

    res.setHeader('RateLimit-Limit', String(options.maxRequests));
    res.setHeader('RateLimit-Remaining', String(remaining));
    res.setHeader('RateLimit-Reset', String(retryAfterSec));

    if (bucket.count > options.maxRequests) {
      res.setHeader('Retry-After', String(retryAfterSec));
      res.status(429).json({
        error: options.message,
        retryAfterSeconds: retryAfterSec,
      });
      return;
    }

    next();
  };
}
