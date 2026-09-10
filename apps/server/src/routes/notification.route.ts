import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { list, unreadCount, markRead } from '../controllers/notification.controller';

export const notificationRouter = Router();

notificationRouter.use(authenticate);

notificationRouter.get('/', list);
notificationRouter.get('/unread-count', unreadCount);
notificationRouter.post('/mark-read', markRead);