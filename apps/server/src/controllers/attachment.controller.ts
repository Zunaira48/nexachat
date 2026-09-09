import type { Request, Response, NextFunction } from 'express';
import { createUploadUrl, confirmAttachment } from '../services/attachment.service';
import { AppError } from '../utils/AppError';
import { getIO } from '../socket';

function getConversationId(req: Request): string {
  const raw = req.params.conversationId;
  const id = Array.isArray(raw) ? raw[0] : raw;
  if (!id) throw new AppError('conversationId is required', 400);
  return id;
}

export async function requestUpload(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new AppError('Authentication required', 401);
    const conversationId = getConversationId(req);

    const result = await createUploadUrl(
      conversationId,
      req.user.sub,
      req.body.fileName,
      req.body.mimeType,
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function confirm(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new AppError('Authentication required', 401);
    const conversationId = getConversationId(req);

    const message = await confirmAttachment(conversationId, req.user.sub, req.body);

    getIO().to(`conversation:${conversationId}`).emit('new_message', message);
    getIO().to(`conversation:${conversationId}`).emit('conversation_updated', { conversationId });

    res.status(201).json({ message });
  } catch (err) {
    next(err);
  }
}