"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const node_path_1 = require("node:path");
const app_1 = require("./app");
dotenv_1.default.config({ path: (0, node_path_1.resolve)(__dirname, '../../.env') });
const PORT = Number(process.env.PORT ?? 3001);
if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535.');
}
const configuredOrigins = process.env.CORS_ORIGIN?.split(',').map((origin) => origin.trim()).filter(Boolean);
if (process.env.NODE_ENV === 'production' && !configuredOrigins?.length) {
    throw new Error('CORS_ORIGIN must contain the deployed frontend origin in production.');
}
const allowedOrigins = configuredOrigins?.length ? configuredOrigins : [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5174',
];
const app = (0, app_1.createApp)(allowedOrigins);
app.listen(PORT, '0.0.0.0', () => {
    const aiConfigured = !!process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== 'your_groq_api_key_here';
    console.log(`\n🎓 Classroom Copilot Server listening on port ${PORT}`);
    console.log(`   AI Mode: ${aiConfigured ? '✅ Groq configured' : '⚠️  Demo mode (no API key)'}`);
    console.log(`   Allowed frontend origins: ${allowedOrigins.join(', ')}\n`);
});
