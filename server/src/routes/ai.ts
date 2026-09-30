import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { AIProviderError, generateAIResponse, isAIConfigured } from '../services/aiProvider';
import { buildExplainPrompt, buildTranslatePrompt, buildQuizPrompt, SYSTEM_INSTRUCTION } from '../services/prompts';
import { getDemoExplanation, getDemoTranslation, DEMO_QUIZ } from '../services/demoContent';
import { AppError } from '../middleware/errorHandler';

export const aiRouter = Router();

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { error: 'Too many requests. Please wait a moment and try again.', status: 429 },
});

aiRouter.use(aiLimiter);

const MAX_TEXT_LENGTH = 100_000;

const explainSchema = z.object({
  text: z.string().trim().min(1, 'Text is required').max(MAX_TEXT_LENGTH, `Text must be under ${MAX_TEXT_LENGTH} characters`),
  level: z.enum(['very-simple', 'school', 'college']).default('school'),
  style: z.enum(['summary', 'step-by-step', 'examples']).default('summary'),
  length: z.enum(['short', 'detailed']).default('short'),
});

const translateSchema = z.object({
  text: z.string().trim().min(1, 'Text is required').max(MAX_TEXT_LENGTH, `Text must be under ${MAX_TEXT_LENGTH} characters`),
  targetLang: z.enum(['en', 'hi', 'mr', 'kok']),
});

const quizSchema = z.object({
  text: z.string().trim().min(1, 'Text is required').max(MAX_TEXT_LENGTH, `Text must be under ${MAX_TEXT_LENGTH} characters`),
});

const quizOutputSchema = z.object({
  questions: z.array(z.object({
    id: z.number().int().positive().optional(),
    question: z.string().trim().min(1),
    options: z.array(z.string().trim().min(1)).length(4).refine(
      options => new Set(options.map(option => option.toLocaleLowerCase())).size === 4,
      'Answer options must be distinct',
    ),
    correctAnswer: z.number().int().min(0).max(3),
    explanation: z.string().trim().min(1),
  })).length(5),
});

function validate<T>(schema: z.ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const messages = result.error.errors.map(e => e.message).join('; ');
      return next(new AppError(400, messages));
    }
    req.body = result.data;
    next();
  };
}

function getSafeProviderMessage(error: unknown, operation: string): string {
  if (error instanceof AIProviderError) return error.message;
  return `${operation} failed unexpectedly. Please retry.`;
}

aiRouter.post('/explain', validate(explainSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { text, level, style, length } = req.body;

    if (!isAIConfigured()) {
      return res.json({
        explanation: getDemoExplanation(level, length),
        mode: 'demo',
      });
    }

    const prompt = buildExplainPrompt(text, level, style, length);
    const result = await generateAIResponse(prompt, SYSTEM_INSTRUCTION);
    res.json({
      explanation: result.text,
      mode: result.mode,
    });
  } catch (error: unknown) {
    next(new AppError(502, getSafeProviderMessage(error, 'Explanation')));
  }
});

aiRouter.post('/translate', validate(translateSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { text, targetLang } = req.body;

    if (!isAIConfigured()) {
      return res.json({
        translation: getDemoTranslation(targetLang),
        mode: 'demo',
        targetLang,
      });
    }

    const prompt = buildTranslatePrompt(text, targetLang);
    const result = await generateAIResponse(prompt, SYSTEM_INSTRUCTION);
    res.json({
      translation: result.text,
      mode: result.mode,
      targetLang,
    });
  } catch (error: unknown) {
    next(new AppError(502, getSafeProviderMessage(error, 'Translation')));
  }
});

aiRouter.post('/quiz', validate(quizSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { text } = req.body;

    if (!isAIConfigured()) {
      return res.json({
        quiz: DEMO_QUIZ,
        mode: 'demo',
      });
    }

    const prompt = buildQuizPrompt(text);
    const result = await generateAIResponse(prompt, SYSTEM_INSTRUCTION, { jsonMode: true });

    let quizData: unknown;
    try {
      quizData = JSON.parse(result.text);
    } catch {
      return next(new AppError(502, 'Groq returned malformed quiz data. Please retry.'));
    }

    const parsedQuiz = quizOutputSchema.safeParse(quizData);
    if (!parsedQuiz.success) {
      return next(new AppError(502, 'Groq returned an incomplete quiz. Please retry.'));
    }

    const questions = parsedQuiz.data.questions.map((question, index) => ({
      ...question,
      id: question.id ?? index + 1,
    }));

    res.json({
      quiz: { questions },
      mode: result.mode,
    });
  } catch (error: unknown) {
    next(new AppError(502, getSafeProviderMessage(error, 'Quiz generation')));
  }
});
