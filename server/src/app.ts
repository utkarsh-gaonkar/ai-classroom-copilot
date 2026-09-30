import express from 'express';
import cors from 'cors';
import { aiRouter } from './routes/ai';
import { healthRouter } from './routes/health';
import { errorHandler } from './middleware/errorHandler';

export function createApp(allowedOrigins: string[]) {
  const app = express();

  app.use(cors({
    origin(origin, callback) {
      callback(null, !origin || allowedOrigins.includes(origin));
    },
  }));
  app.use(express.json({ limit: '128kb' }));

  app.use('/api/health', healthRouter);
  app.use('/api/ai', aiRouter);
  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'API endpoint not found.', status: 404 });
  });

  app.use(errorHandler);
  return app;
}