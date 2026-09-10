import type { Request, Response, NextFunction } from 'express';
import { listNotifications, getUnreadCount, markAllRead } from '../services/notification.service';
import { AppError } from '../utils/AppError';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new AppError('Authentication required', 401);
    const notifications = await listNotifications(req.user.sub);
    res.json({ notifications });
  } catch (err) {
    next(err);
  }
}

export async function unreadCount(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new AppError('Authentication required', 401);
    const count = await getUnreadCount(req.user.sub);
    res.json({ count });
  } catch (err) {
    next(err);
  }
}

export async function markRead(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new AppError('Authentication required', 401);
    await markAllRead(req.user.sub);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}