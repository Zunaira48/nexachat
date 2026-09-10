import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { messages, conversations } from '../controllers/search.controller';

export const searchRouter = Router();

searchRouter.use(authenticate);

searchRouter.get('/messages', messages);
searchRouter.get('/conversations', conversations);