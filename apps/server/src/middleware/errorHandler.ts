import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/AppError';
import { env } from '../config/env';

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: {
        message: err.message,
      },
    });
  }

  // Unexpected error — never leak internals to the client (Section 33/46)
  req.log?.error(err);
  return res.status(500).json({
    error: {
      message:
        env.NODE_ENV === 'production'
          ? 'Something went wrong'
          : (err as Error)?.message ?? 'Unknown error',
    },
  });
}