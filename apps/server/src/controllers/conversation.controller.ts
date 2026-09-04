import type { Request, Response, NextFunction } from 'express';
import { listConversationsForUser, createDirectConversation } from '../services/conversation.service';
import { AppError } from '../utils/AppError';
import { isOnline } from '../socket';
import { toggleFavorite } from '../services/conversation.service';

export async function listConversations(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new AppError('Authentication required', 401);
    const conversations = await listConversationsForUser(req.user.sub);

    // Attach current presence for each member so the UI has correct
    // initial state before any 'presence_update' socket event arrives.
    const withPresence = conversations.map((c: (typeof conversations)[number]) => ({
      ...c,
      members: c.members.map((m: (typeof c.members)[number]) => ({
        ...m,
        user: { ...m.user, online: isOnline(m.user.id) },
      })),
    }));

    res.json({ conversations: withPresence });
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


export async function favorite(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new AppError('Authentication required', 401);
    const raw = req.params.conversationId;
    const conversationId = Array.isArray(raw) ? raw[0] : raw;
    if (!conversationId) throw new AppError('conversationId is required', 400);

    const membership = await toggleFavorite(conversationId, req.user.sub);
    res.json({ isFavorite: membership.isFavorite });
  } catch (err) {
    next(err);
  }
}