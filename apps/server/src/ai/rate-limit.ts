import { env } from '../config/env';
import { AppError } from '../utils/AppError';

interface UsageWindow {
  count: number;
  windowStart: number;
}

const usage = new Map<string, UsageWindow>();
const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const AI_RATE_LIMIT_PER_USER_PER_HOUR = Number(
  process.env.AI_RATE_LIMIT_PER_USER_PER_HOUR ?? 100,
);

export function assertWithinAIRateLimit(userId: string) {
  const now = Date.now();
  const existing = usage.get(userId);

  if (!existing || now - existing.windowStart > WINDOW_MS) {
    usage.set(userId, { count: 1, windowStart: now });
    return;
  }

  if (existing.count >= AI_RATE_LIMIT_PER_USER_PER_HOUR) {
    throw new AppError(
      `AI request limit reached (${AI_RATE_LIMIT_PER_USER_PER_HOUR}/hour). Try again later.`,
      429,
    );
  }

  existing.count += 1;
}