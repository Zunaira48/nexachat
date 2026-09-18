import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { aiRateLimit } from '../middleware/aiRateLimit';
import { validate } from '../middleware/validate';
import { ping } from '../controllers/ai-test.controller';
import { replySuggestions, rewrite } from '../controllers/ai.controller';
import { replySuggestionsSchema, rewriteSchema } from '../validators/ai.validator';

export const aiRouter = Router();

aiRouter.use(authenticate);
aiRouter.use(aiRateLimit);

aiRouter.get('/ping', ping);
aiRouter.post('/reply-suggestions', validate(replySuggestionsSchema), replySuggestions);
aiRouter.post('/rewrite', validate(rewriteSchema), rewrite);