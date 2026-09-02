import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { healthRouter } from './routes/health.route';

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
  app.use(pinoHttp());

  app.use('/health', healthRouter);

  // 404 for anything unmatched — must come after all real routes
  app.use((_req, res) => {
    res.status(404).json({ error: { message: 'Not found' } });
  });

  // Error handler must be registered LAST
  app.use(errorHandler);

  return app;
}