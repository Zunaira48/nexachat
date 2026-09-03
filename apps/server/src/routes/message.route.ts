import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { sendMessageSchema, listMessagesQuerySchema } from '../validators/message.validator';
import { create, list } from '../controllers/message.controller';

export const messageRouter = Router({ mergeParams: true });

messageRouter.use(authenticate);

messageRouter.post('/', validate(sendMessageSchema), create);

messageRouter.get(
  '/',
  (req, res, next) => {
    const parsed = listMessagesQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Invalid query parameters';
      return res.status(400).json({ error: { message } });
    }
    // Express 5 made req.query getter-only — attach parsed data
    // to a new property instead of reassigning req.query directly.
    res.locals.validatedQuery = parsed.data;
    next();
  },
  list,
);