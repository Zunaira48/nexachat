import type { Request, Response, NextFunction } from 'express';
import { searchMessages, searchConversations } from '../services/search.service';
import { AppError } from '../utils/AppError';

export async function messages(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new AppError('Authentication required', 401);
    const query = typeof req.query.q === 'string' ? req.query.q : '';
    const results = await searchMessages(req.user.sub, query);
    res.json({ results });
  } catch (err) {
    next(err);
  }
}

export async function conversations(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new AppError('Authentication required', 401);
    const query = typeof req.query.q === 'string' ? req.query.q : '';
    const results = await searchConversations(req.user.sub, query);
    res.json({ results });
  } catch (err) {
    next(err);
  }
}