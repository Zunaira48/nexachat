import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { generateReplySuggestions, rewriteMessage } from '../services/ai.service';

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

export async function rewrite(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new AppError('Authentication required', 401);
    const { content, style } = req.body as {
      content: string;
      style: 'PROFESSIONAL' | 'CASUAL' | 'GRAMMAR';
    };

    const rewritten = await rewriteMessage(content, style);
    res.json({ rewritten });
  } catch (err) {
    next(err);
  }
}