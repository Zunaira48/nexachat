import { Router } from 'express';
import { validate } from '../middleware/validate';
import { registerSchema, loginSchema } from '../validators/auth.validator';
import { register, login, refresh, logout } from '../controllers/auth.controller';
import { loginRateLimit, registerRateLimit } from '../middleware/rateLimit';

export const authRouter = Router();

authRouter.post('/register', registerRateLimit, validate(registerSchema), register);
authRouter.post('/login', loginRateLimit, validate(loginSchema), login);
authRouter.post('/refresh', refresh);
authRouter.post('/logout', logout);