import type { Request, Response, NextFunction } from 'express';
import {
  sendMessage,
  listMessages,
  editMessage,
  deleteMessage,
  addReaction,
  removeReaction,
  togglePin,
} from '../services/message.service';
import { AppError } from '../utils/AppError';
import { getIO } from '../socket';

function getParam(req: Request, name: string): string {
  const raw = req.params[name];
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) throw new AppError(`${name} is required`, 400);
  return value;
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new AppError('Authentication required', 401);
    const conversationId = getParam(req, 'conversationId');

    const message = await sendMessage(
      conversationId,
      req.user.sub,
      req.body.content,
      req.body.replyToId,
    );

    getIO().to(`conversation:${conversationId}`).emit('new_message', message);
    getIO().to(`conversation:${conversationId}`).emit('conversation_updated', { conversationId });

    res.status(201).json({ message });
  } catch (err) {
    next(err);
  }
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new AppError('Authentication required', 401);
    const conversationId = getParam(req, 'conversationId');
    const { cursor, limit } = res.locals.validatedQuery as { cursor?: string; limit: number };
    const result = await listMessages(conversationId, req.user.sub, cursor, limit);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new AppError('Authentication required', 401);
    const conversationId = getParam(req, 'conversationId');
    const messageId = getParam(req, 'messageId');

    const message = await editMessage(messageId, req.user.sub, req.body.content);
    getIO().to(`conversation:${conversationId}`).emit('message_edited', message);
    res.json({ message });
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new AppError('Authentication required', 401);
    const conversationId = getParam(req, 'conversationId');
    const messageId = getParam(req, 'messageId');

    const message = await deleteMessage(messageId, req.user.sub);
    getIO().to(`conversation:${conversationId}`).emit('message_deleted', {
      id: message.id,
      conversationId,
    });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function react(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new AppError('Authentication required', 401);
    const conversationId = getParam(req, 'conversationId');
    const messageId = getParam(req, 'messageId');

    const reaction = await addReaction(conversationId, messageId, req.user.sub, req.body.emoji);
    getIO().to(`conversation:${conversationId}`).emit('message_reaction_added', reaction);
    res.status(201).json({ reaction });
  } catch (err) {
    next(err);
  }
}

export async function unreact(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new AppError('Authentication required', 401);
    const conversationId = getParam(req, 'conversationId');
    const messageId = getParam(req, 'messageId');
    const emoji = getParam(req, 'emoji');

    await removeReaction(conversationId, messageId, req.user.sub, emoji);
    getIO().to(`conversation:${conversationId}`).emit('message_reaction_removed', {
      messageId,
      userId: req.user.sub,
      emoji,
    });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function pin(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new AppError('Authentication required', 401);
    const conversationId = getParam(req, 'conversationId');
    const messageId = getParam(req, 'messageId');

    const message = await togglePin(conversationId, messageId, req.user.sub);
    getIO().to(`conversation:${conversationId}`).emit('message_pin_toggled', message);
    res.json({ message });
  } catch (err) {
    next(err);
  }
}