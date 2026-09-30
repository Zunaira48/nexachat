import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';

interface UsageWindow {
  count: number;
  windowStart: number;
}

interface RateLimitOptions {
  windowMs: number;
  max: number;
  message: string;
  keyGenerator: (req: Request) => string;
}

// Simple in-memory fixed-window limiter — same pattern already used for
// AI rate limiting (ai/rate-limit.ts). Fine for a single-instance server;
// would need a shared store (e.g. Redis) if this ever runs on multiple
// instances behind a load balancer (Section 52 — not needed yet).
export function createRateLimiter({ windowMs, max, message, keyGenerator }: RateLimitOptions) {
  const usage = new Map<string, UsageWindow>();

  return function rateLimit(req: Request, _res: Response, next: NextFunction) {
    const key = keyGenerator(req);
    const now = Date.now();
    const existing = usage.get(key);

    if (!existing || now - existing.windowStart > windowMs) {
      usage.set(key, { count: 1, windowStart: now });
      return next();
    }

    if (existing.count >= max) {
      return next(new AppError(message, 429));
    }

    existing.count += 1;
    next();
  };
}

function byIp(req: Request): string {
  return req.ip ?? 'unknown';
}

export const loginRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many login attempts. Please try again later.',
  keyGenerator: byIp,
});

export const registerRateLimit = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: 'Too many accounts created from this network. Please try again later.',
  keyGenerator: byIp,
});

export const uploadRateLimit = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 30,
  message: 'Too many upload requests. Please try again later.',
  keyGenerator: (req) => req.user?.sub ?? byIp(req),
});