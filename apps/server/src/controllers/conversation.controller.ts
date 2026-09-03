import type { Request, Response, NextFunction } from 'express';
import { listConversationsForUser, createDirectConversation } from '../services/conversation.service';
import { AppError } from '../utils/AppError';

export async function listConversations(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new AppError('Authentication required', 401);
    const conversations = await listConversationsForUser(req.user.sub);
    res.json({ conversations });
  } catch (err) {
    next(err);
  }
}

export async function createConversation(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new AppError('Authentication required', 401);
    const { userId } = req.body;
    if (!userId) throw new AppError('userId is required', 400);

    const conversation = await createDirectConversation(req.user.sub, userId);
    res.status(201).json({ conversation });
  } catch (err) {
    next(err);
  }
}