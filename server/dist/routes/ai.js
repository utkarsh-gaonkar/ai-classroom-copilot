"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const aiProvider_1 = require("../services/aiProvider");
const prompts_1 = require("../services/prompts");
const demoContent_1 = require("../services/demoContent");
const errorHandler_1 = require("../middleware/errorHandler");
exports.aiRouter = (0, express_1.Router)();
const aiLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000,
    max: 20,
    message: { error: 'Too many requests. Please wait a moment and try again.', status: 429 },
});
exports.aiRouter.use(aiLimiter);
const MAX_TEXT_LENGTH = 100_000;
const explainSchema = zod_1.z.object({
    text: zod_1.z.string().trim().min(1, 'Text is required').max(MAX_TEXT_LENGTH, `Text must be under ${MAX_TEXT_LENGTH} characters`),
    level: zod_1.z.enum(['very-simple', 'school', 'college']).default('school'),
    style: zod_1.z.enum(['summary', 'step-by-step', 'examples']).default('summary'),
    length: zod_1.z.enum(['short', 'detailed']).default('short'),
});
const translateSchema = zod_1.z.object({
    text: zod_1.z.string().trim().min(1, 'Text is required').max(MAX_TEXT_LENGTH, `Text must be under ${MAX_TEXT_LENGTH} characters`),
    targetLang: zod_1.z.enum(['en', 'hi', 'mr', 'kok']),
});
const quizSchema = zod_1.z.object({
    text: zod_1.z.string().trim().min(1, 'Text is required').max(MAX_TEXT_LENGTH, `Text must be under ${MAX_TEXT_LENGTH} characters`),
});
const quizOutputSchema = zod_1.z.object({
    questions: zod_1.z.array(zod_1.z.object({
        id: zod_1.z.number().int().positive().optional(),
        question: zod_1.z.string().trim().min(1),
        options: zod_1.z.array(zod_1.z.string().trim().min(1)).length(4).refine(options => new Set(options.map(option => option.toLocaleLowerCase())).size === 4, 'Answer options must be distinct'),
        correctAnswer: zod_1.z.number().int().min(0).max(3),
        explanation: zod_1.z.string().trim().min(1),
    })).length(5),
});
function validate(schema) {
    return (req, _res, next) => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            const messages = result.error.errors.map(e => e.message).join('; ');
            return next(new errorHandler_1.AppError(400, messages));
        }
        req.body = result.data;
        next();
    };
}
function getSafeProviderMessage(error, operation) {
    if (error instanceof aiProvider_1.AIProviderError)
        return error.message;
    return `${operation} failed unexpectedly. Please retry.`;
}
exports.aiRouter.post('/explain', validate(explainSchema), async (req, res, next) => {
    try {
        const { text, level, style, length } = req.body;
        if (!(0, aiProvider_1.isAIConfigured)()) {
            return res.json({
                explanation: (0, demoContent_1.getDemoExplanation)(level, length),
                mode: 'demo',
            });
        }
        const prompt = (0, prompts_1.buildExplainPrompt)(text, level, style, length);
        const result = await (0, aiProvider_1.generateAIResponse)(prompt, prompts_1.SYSTEM_INSTRUCTION);
        res.json({
            explanation: result.text,
            mode: result.mode,
        });
    }
    catch (error) {
        next(new errorHandler_1.AppError(502, getSafeProviderMessage(error, 'Explanation')));
    }
});
exports.aiRouter.post('/translate', validate(translateSchema), async (req, res, next) => {
    try {
        const { text, targetLang } = req.body;
        if (!(0, aiProvider_1.isAIConfigured)()) {
            return res.json({
                translation: (0, demoContent_1.getDemoTranslation)(targetLang),
                mode: 'demo',
                targetLang,
            });
        }
        const prompt = (0, prompts_1.buildTranslatePrompt)(text, targetLang);
        const result = await (0, aiProvider_1.generateAIResponse)(prompt, prompts_1.SYSTEM_INSTRUCTION);
        res.json({
            translation: result.text,
            mode: result.mode,
            targetLang,
        });
    }
    catch (error) {
        next(new errorHandler_1.AppError(502, getSafeProviderMessage(error, 'Translation')));
    }
});
exports.aiRouter.post('/quiz', validate(quizSchema), async (req, res, next) => {
    try {
        const { text } = req.body;
        if (!(0, aiProvider_1.isAIConfigured)()) {
            return res.json({
                quiz: demoContent_1.DEMO_QUIZ,
                mode: 'demo',
            });
        }
        const prompt = (0, prompts_1.buildQuizPrompt)(text);
        const result = await (0, aiProvider_1.generateAIResponse)(prompt, prompts_1.SYSTEM_INSTRUCTION, { jsonMode: true });
        let quizData;
        try {
            quizData = JSON.parse(result.text);
        }
        catch {
            return next(new errorHandler_1.AppError(502, 'Groq returned malformed quiz data. Please retry.'));
        }
        const parsedQuiz = quizOutputSchema.safeParse(quizData);
        if (!parsedQuiz.success) {
            return next(new errorHandler_1.AppError(502, 'Groq returned an incomplete quiz. Please retry.'));
        }
        const questions = parsedQuiz.data.questions.map((question, index) => ({
            ...question,
            id: question.id ?? index + 1,
        }));
        res.json({
            quiz: { questions },
            mode: result.mode,
        });
    }
    catch (error) {
        next(new errorHandler_1.AppError(502, getSafeProviderMessage(error, 'Quiz generation')));
    }
});
