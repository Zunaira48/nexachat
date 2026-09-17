import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { aiRateLimit } from '../middleware/aiRateLimit';
import { ping } from '../controllers/ai-test.controller';

export const aiRouter = Router();

aiRouter.use(authenticate);
aiRouter.use(aiRateLimit);

aiRouter.get('/ping', ping);