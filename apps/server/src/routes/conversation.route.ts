import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { listConversations, createConversation } from '../controllers/conversation.controller';

export const conversationRouter = Router();

conversationRouter.use(authenticate);

conversationRouter.get('/', listConversations);
conversationRouter.post('/', createConversation);