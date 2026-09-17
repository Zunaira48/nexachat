import type { Request, Response, NextFunction } from 'express';
import { aiProvider } from '../ai';
import { AppError } from '../utils/AppError';

export async function ping(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new AppError('Authentication required', 401);
    const text = await aiProvider.generateText(
      'Reply with exactly one short sentence confirming you received this test message.',
    );
    res.json({ text });
  } catch (err) {
    next(err);
  }
}