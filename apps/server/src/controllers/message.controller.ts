import type { Request, Response, NextFunction } from 'express';
import { sendMessage, listMessages } from '../services/message.service';
import { AppError } from '../utils/AppError';

function getConversationId(req: Request): string {
  const raw = req.params.conversationId;
  const id = Array.isArray(raw) ? raw[0] : raw;
  if (!id) throw new AppError('conversationId is required', 400);
  return id;
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new AppError('Authentication required', 401);
    const conversationId = getConversationId(req);

    const message = await sendMessage(conversationId, req.user.sub, req.body.content);
    res.status(201).json({ message });
  } catch (err) {
    next(err);
  }
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new AppError('Authentication required', 401);
    const conversationId = getConversationId(req);

    const { cursor, limit } = res.locals.validatedQuery as { cursor?: string; limit: number };
    const result = await listMessages(conversationId, req.user.sub, cursor, limit);
    res.json(result);
  } catch (err) {
    next(err);
  }
}