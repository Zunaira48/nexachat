import type { Request, Response, NextFunction } from 'express';
import { registerUser, loginUser, refreshSession, logoutUser } from '../services/auth.service';
import { REFRESH_COOKIE_NAME, getRefreshCookieOptions } from '../config/cookies';
import { AppError } from '../utils/AppError';

function getMeta(req: Request) {
  return {
    userAgent: req.headers['user-agent'],
    ipAddress: req.ip,
  };
}

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await registerUser(req.body);
    res.status(201).json({ user });
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { user, accessToken, refreshToken } = await loginUser(req.body, getMeta(req));
    res.cookie(REFRESH_COOKIE_NAME, refreshToken, getRefreshCookieOptions());
    res.json({ user, accessToken });
  } catch (err) {
    next(err);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.[REFRESH_COOKIE_NAME];
    if (!token) throw new AppError('No refresh token provided', 401);

    const { accessToken, refreshToken } = await refreshSession(token, getMeta(req));
    res.cookie(REFRESH_COOKIE_NAME, refreshToken, getRefreshCookieOptions());
    res.json({ accessToken });
  } catch (err) {
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.[REFRESH_COOKIE_NAME];
    if (token) await logoutUser(token);
    res.clearCookie(REFRESH_COOKIE_NAME, getRefreshCookieOptions());
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}