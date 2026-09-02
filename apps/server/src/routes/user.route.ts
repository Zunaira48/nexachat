import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { getMe, search } from '../controllers/user.controller';

export const userRouter = Router();

userRouter.use(authenticate); // every route below requires a valid access token

userRouter.get('/me', getMe);
userRouter.get('/search', search);