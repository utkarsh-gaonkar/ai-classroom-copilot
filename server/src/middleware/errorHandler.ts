import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.message,
      status: err.statusCode,
    });
    return;
  }

  const parserError = err as Error & { type?: string };
  if (parserError.type === 'entity.parse.failed') {
    res.status(400).json({ error: 'Request body must contain valid JSON.', status: 400 });
    return;
  }
  if (parserError.type === 'entity.too.large') {
    res.status(413).json({ error: 'Request body exceeds the 128 KB limit.', status: 413 });
    return;
  }

  console.error('Unexpected error:', err.message);
  res.status(500).json({
    error: 'An unexpected error occurred. Please try again.',
    status: 500,
  });
}
