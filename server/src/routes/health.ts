import { Router } from 'express';
import { isAIConfigured } from '../services/aiProvider';

export const healthRouter = Router();

healthRouter.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    mode: isAIConfigured() ? 'ai' : 'demo',
    timestamp: new Date().toISOString(),
  });
});
