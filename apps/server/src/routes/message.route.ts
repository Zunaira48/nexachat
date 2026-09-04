import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import {
  sendMessageSchema,
  editMessageSchema,
  reactSchema,
  listMessagesQuerySchema,
} from '../validators/message.validator';
import {
  create,
  list,
  update,
  remove,
  react,
  unreact,
  pin,
} from '../controllers/message.controller';

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
    res.locals.validatedQuery = parsed.data;
    next();
  },
  list,
);

messageRouter.patch('/:messageId', validate(editMessageSchema), update);
messageRouter.delete('/:messageId', remove);
messageRouter.post('/:messageId/reactions', validate(reactSchema), react);
messageRouter.delete('/:messageId/reactions/:emoji', unreact);
messageRouter.post('/:messageId/pin', pin);