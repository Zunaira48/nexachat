import type { Request, Response, NextFunction } from 'express';
import { listConversationsForUser, createDirectConversation } from '../services/conversation.service';
import { AppError } from '../utils/AppError';
import { isOnline } from '../socket';
import { toggleFavorite } from '../services/conversation.service';
import { prisma } from '../config/prisma';

export async function listConversations(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new AppError('Authentication required', 401);
    const userId = req.user.sub;
    const conversations = await listConversationsForUser(userId);

    // Unread count per conversation: messages not sent by me, with
    // no MessageRead row for me yet — same "unread" definition our
    // read-receipt system already uses (Phase 12).
    const withExtras = await Promise.all(
      conversations.map(async (c: (typeof conversations)[number]) => {
        const unreadCount = await prisma.message.count({
          where: {
            conversationId: c.id,
            senderId: { not: userId },
            deletedAt: null,
            reads: { none: { userId } },
          },
        });

        return {
          ...c,
          unreadCount,
          members: c.members.map((m: (typeof c.members)[number]) => ({
            ...m,
            user: { ...m.user, online: isOnline(m.user.id) },
          })),
        };
      }),
    );

    res.json({ conversations: withExtras });
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