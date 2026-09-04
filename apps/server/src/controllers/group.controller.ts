import type { Request, Response, NextFunction } from 'express';
import {
  createGroup,
  addMember,
  removeMember,
  leaveGroup,
  updateGroupName,
  changeRole,
} from '../services/group.service';
import { AppError } from '../utils/AppError';
import { getIO } from '../socket';

function getParam(req: Request, name: string): string {
  const raw = req.params[name];
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) throw new AppError(`${name} is required`, 400);
  return value;
}

function broadcastSystemMessage(conversationId: string, systemMessage: unknown) {
  getIO().to(`conversation:${conversationId}`).emit('new_message', systemMessage);
  getIO().to(`conversation:${conversationId}`).emit('conversation_updated', { conversationId });
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new AppError('Authentication required', 401);
    const conversation = await createGroup(req.user.sub, req.body.name, req.body.memberIds);
    res.status(201).json({ conversation });
  } catch (err) {
    next(err);
  }
}

export async function addMemberHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new AppError('Authentication required', 401);
    const conversationId = getParam(req, 'conversationId');
    const systemMessage = await addMember(conversationId, req.user.sub, req.body.userId);
    broadcastSystemMessage(conversationId, systemMessage);
    res.status(201).json({ message: systemMessage });
  } catch (err) {
    next(err);
  }
}

export async function removeMemberHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new AppError('Authentication required', 401);
    const conversationId = getParam(req, 'conversationId');
    const targetUserId = getParam(req, 'userId');
    const systemMessage = await removeMember(conversationId, req.user.sub, targetUserId);
    broadcastSystemMessage(conversationId, systemMessage);
    res.json({ message: systemMessage });
  } catch (err) {
    next(err);
  }
}

export async function leaveHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new AppError('Authentication required', 401);
    const conversationId = getParam(req, 'conversationId');
    const systemMessage = await leaveGroup(conversationId, req.user.sub);
    broadcastSystemMessage(conversationId, systemMessage);
    res.json({ message: systemMessage });
  } catch (err) {
    next(err);
  }
}

export async function renameHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new AppError('Authentication required', 401);
    const conversationId = getParam(req, 'conversationId');
    const systemMessage = await updateGroupName(conversationId, req.user.sub, req.body.name);
    broadcastSystemMessage(conversationId, systemMessage);
    res.json({ message: systemMessage });
  } catch (err) {
    next(err);
  }
}

export async function changeRoleHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new AppError('Authentication required', 401);
    const conversationId = getParam(req, 'conversationId');
    const targetUserId = getParam(req, 'userId');
    const systemMessage = await changeRole(
      conversationId,
      req.user.sub,
      targetUserId,
      req.body.role,
    );
    broadcastSystemMessage(conversationId, systemMessage);
    res.json({ message: systemMessage });
  } catch (err) {
    next(err);
  }
}