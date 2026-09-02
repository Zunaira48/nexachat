import type { CookieOptions } from 'express';
import { env } from './env';

export const REFRESH_COOKIE_NAME = 'nexachat_refresh_token';

export function getRefreshCookieOptions(): CookieOptions {
  const isProduction = env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProduction, // HTTPS required in prod; localhost dev uses plain HTTP
    sameSite: isProduction ? 'none' : 'lax', // 'none' needed for Vercel↔Render cross-origin
    path: '/api/auth', // only sent to auth endpoints, not every request
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days, matches REFRESH_TOKEN_TTL_DAYS
  };
}