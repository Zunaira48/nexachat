import type { Request, Response, NextFunction } from 'express';
import { markConversationRead } from '../services/read-receipt.service';
import { AppError } from '../utils/AppError';
import { getIO } from '../socket';

export async function markRead(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new AppError('Authentication required', 401);
    const raw = req.params.conversationId;
    const conversationId = Array.isArray(raw) ? raw[0] : raw;
    if (!conversationId) throw new AppError('conversationId is required', 400);

    const result = await markConversationRead(conversationId, req.user.sub);

    if (result.markedCount > 0) {
      getIO().to(`conversation:${conversationId}`).emit('messages_read', {
        conversationId,
        userId: req.user.sub,
        messageIds: result.messageIds,
      });
    }

    res.json(result);
  } catch (err) {
    next(err);
  }
}