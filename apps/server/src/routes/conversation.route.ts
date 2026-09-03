import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { listConversations, createConversation } from '../controllers/conversation.controller';
import { messageRouter } from './message.route';
import { markRead } from '../controllers/read-receipt.controller';

export const conversationRouter = Router();

conversationRouter.use(authenticate);

conversationRouter.get('/', listConversations);
conversationRouter.post('/', createConversation);
conversationRouter.post('/:conversationId/read', markRead);
conversationRouter.use('/:conversationId/messages', messageRouter);