"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const ai_1 = require("./routes/ai");
const health_1 = require("./routes/health");
const errorHandler_1 = require("./middleware/errorHandler");
dotenv_1.default.config({ path: '../.env' });
const app = (0, express_1.default)();
const PORT = Number(process.env.PORT) || 3001;
const configuredOrigins = process.env.CORS_ORIGIN?.split(',').map((origin) => origin.trim()).filter(Boolean);
if (process.env.NODE_ENV === 'production' && !configuredOrigins?.length) {
    throw new Error('CORS_ORIGIN must contain the deployed frontend origin in production.');
}
const allowedOrigins = configuredOrigins?.length ? configuredOrigins : ['http://localhost:5173', 'http://127.0.0.1:5173'];
app.use((0, cors_1.default)({
    origin(origin, callback) {
        callback(null, !origin || allowedOrigins.includes(origin));
    },
}));
app.use(express_1.default.json({ limit: '128kb' }));
app.use('/api/health', health_1.healthRouter);
app.use('/api/ai', ai_1.aiRouter);
app.use(errorHandler_1.errorHandler);
app.listen(PORT, '0.0.0.0', () => {
    const aiConfigured = !!process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== 'your_groq_api_key_here';
    console.log(`\n🎓 Classroom Copilot Server listening on port ${PORT}`);
    console.log(`   AI Mode: ${aiConfigured ? '✅ Groq configured' : '⚠️  Demo mode (no API key)'}`);
    console.log(`   Allowed frontend origins: ${allowedOrigins.join(', ')}\n`);
});
