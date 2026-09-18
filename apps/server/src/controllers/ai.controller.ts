import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { generateReplySuggestions } from '../services/ai.service';

export async function replySuggestions(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new AppError('Authentication required', 401);
    const { conversationId } = req.body as { conversationId: string };

    const suggestions = await generateReplySuggestions(conversationId, req.user.sub);
    res.json({ suggestions });
  } catch (err) {
    next(err);
  }
}