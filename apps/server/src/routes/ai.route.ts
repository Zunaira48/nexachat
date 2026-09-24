import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { aiRateLimit } from '../middleware/aiRateLimit';
import { validate } from '../middleware/validate';
import { ping } from '../controllers/ai-test.controller';
import { replySuggestions, rewrite, summarize, ask, summarizeUnread } from '../controllers/ai.controller';
import { replySuggestionsSchema, rewriteSchema, summarizeSchema, askSchema } from '../validators/ai.validator';

export const aiRouter = Router();

aiRouter.use(authenticate);
aiRouter.use(aiRateLimit);

aiRouter.get('/ping', ping);
aiRouter.post('/reply-suggestions', validate(replySuggestionsSchema), replySuggestions);
aiRouter.post('/summarize', validate(summarizeSchema), summarize);
aiRouter.post('/ask', validate(askSchema), ask);
aiRouter.post('/summarize-unread', validate(summarizeSchema), summarizeUnread);