import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../config/env';

const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_TTL_DAYS = 30;

export interface AccessTokenPayload {
  sub: string; // userId
  email: string;
}

export function signAccessToken(payload: AccessTokenPayload) {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: ACCESS_TOKEN_TTL });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
}

// Refresh tokens are random opaque strings, NOT JWTs — they're just a
// lookup key into the Session table, so revocation is instant and
// doesn't depend on waiting for a JWT to expire.
export function generateRefreshToken() {
  return crypto.randomBytes(64).toString('hex');
}

export function hashRefreshToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function getRefreshTokenExpiry() {
  const expires = new Date();
  expires.setDate(expires.getDate() + REFRESH_TOKEN_TTL_DAYS);
  return expires;
}