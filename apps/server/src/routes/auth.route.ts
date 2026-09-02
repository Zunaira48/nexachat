import { Router } from 'express';
import { validate } from '../middleware/validate';
import { registerSchema } from '../validators/auth.validator';
import { register } from '../controllers/auth.controller';

export const authRouter = Router();

authRouter.post('/register', validate(registerSchema), register);