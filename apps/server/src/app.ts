import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { healthRouter } from './routes/health.route';
import { authRouter } from './routes/auth.route';
import { userRouter } from './routes/user.route';
import { conversationRouter } from './routes/conversation.route';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true, // needed later for cookie-based refresh tokens (Phase 5)
    }),
  );
  app.use(express.json());
  app.use(cookieParser());
  app.use(pinoHttp());

  app.use('/health', healthRouter);
  
  app.use('/api/auth', authRouter);
  app.use('/api/users', userRouter);
  app.use('/api/conversations', conversationRouter);

  // 404 for anything unmatched — must come after all real routes
  app.use((_req, res) => {
    res.status(404).json({ error: { message: 'Not found' } });
  });

  // Error handler must be registered LAST
  app.use(errorHandler);

  return app;
}