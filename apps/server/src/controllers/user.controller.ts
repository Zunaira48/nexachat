import type { Request, Response, NextFunction } from 'express';
import { getUserById, searchUsers } from '../services/user.service';
import { AppError } from '../utils/AppError';

export async function getMe(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new AppError('Authentication required', 401);
    const user = await getUserById(req.user.sub);
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

export async function search(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new AppError('Authentication required', 401);
    const query = typeof req.query.q === 'string' ? req.query.q : '';
    const users = await searchUsers(query, req.user.sub);
    res.json({ users });
  } catch (err) {
    next(err);
  }
}