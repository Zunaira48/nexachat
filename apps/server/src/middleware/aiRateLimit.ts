import type { Request, Response, NextFunction } from 'express';
import { assertWithinAIRateLimit } from '../ai/rate-limit';
import { AppError } from '../utils/AppError';

export function aiRateLimit(req: Request, _res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new AppError('Authentication required', 401);
    assertWithinAIRateLimit(req.user.sub);
    next();
  } catch (err) {
    next(err);
  }
}