import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { aiRouter } from './routes/ai';
import { healthRouter } from './routes/health';
import { errorHandler } from './middleware/errorHandler';

dotenv.config({ path: '../.env' });

const app = express();
const PORT = Number(process.env.PORT) || 3001;
const configuredOrigins = process.env.CORS_ORIGIN?.split(',').map((origin) => origin.trim()).filter(Boolean);
if (process.env.NODE_ENV === 'production' && !configuredOrigins?.length) {
  throw new Error('CORS_ORIGIN must contain the deployed frontend origin in production.');
}
const allowedOrigins = configuredOrigins?.length ? configuredOrigins : ['http://localhost:5173', 'http://127.0.0.1:5173'];

app.use(cors({
  origin(origin, callback) {
    callback(null, !origin || allowedOrigins.includes(origin));
  },
}));
app.use(express.json({ limit: '128kb' }));

app.use('/api/health', healthRouter);
app.use('/api/ai', aiRouter);

app.use(errorHandler);

app.listen(PORT, '0.0.0.0', () => {
  const aiConfigured = !!process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== 'your_groq_api_key_here';
  console.log(`\n🎓 Classroom Copilot Server listening on port ${PORT}`);
  console.log(`   AI Mode: ${aiConfigured ? '✅ Groq configured' : '⚠️  Demo mode (no API key)'}`);
  console.log(`   Allowed frontend origins: ${allowedOrigins.join(', ')}\n`);
});
