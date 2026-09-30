"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const app_1 = require("./app");
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
];
const originalApiKey = process.env.GROQ_API_KEY;
process.env.GROQ_API_KEY = '';
const server = (0, app_1.createApp)(allowedOrigins).listen(0, '127.0.0.1');
let baseUrl = '';
(0, node_test_1.before)(async () => {
    await new Promise((resolve, reject) => {
        server.once('listening', resolve);
        server.once('error', reject);
    });
    const address = server.address();
    baseUrl = `http://127.0.0.1:${address.port}`;
});
(0, node_test_1.after)(async () => {
    await new Promise((resolve, reject) => {
        server.close((error) => error ? reject(error) : resolve());
    });
    if (originalApiKey === undefined)
        delete process.env.GROQ_API_KEY;
    else
        process.env.GROQ_API_KEY = originalApiKey;
});
(0, node_test_1.test)('health endpoint reports service status', async () => {
    const response = await fetch(`${baseUrl}/api/health`);
    const body = await response.json();
    strict_1.default.equal(response.status, 200);
    strict_1.default.equal(body.status, 'ok');
    strict_1.default.ok(['ai', 'demo'].includes(body.mode));
});
(0, node_test_1.test)('explain endpoint returns a demo explanation for valid input', async () => {
    const response = await fetch(`${baseUrl}/api/ai/explain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'Cells use energy to carry out life processes.', level: 'school', style: 'summary', length: 'short' }),
    });
    const body = await response.json();
    strict_1.default.equal(response.status, 200);
    strict_1.default.equal(body.mode, 'demo');
    strict_1.default.ok(body.explanation.length > 0);
});
(0, node_test_1.test)('explain endpoint accepts study material below the 100,000-character limit', async () => {
    const response = await fetch(`${baseUrl}/api/ai/explain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'x'.repeat(99_000), level: 'school', style: 'summary', length: 'short' }),
    });
    const body = await response.json();
    strict_1.default.equal(response.status, 200);
    strict_1.default.equal(body.mode, 'demo');
});
(0, node_test_1.test)('translate endpoint returns a demo translation for valid input', async () => {
    const response = await fetch(`${baseUrl}/api/ai/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'Cells use energy.', targetLang: 'hi' }),
    });
    const body = await response.json();
    strict_1.default.equal(response.status, 200);
    strict_1.default.equal(body.mode, 'demo');
    strict_1.default.equal(body.targetLang, 'hi');
    strict_1.default.ok(body.translation.length > 0);
});
(0, node_test_1.test)('quiz endpoint returns the default 30 demo questions for valid input', async () => {
    const response = await fetch(`${baseUrl}/api/ai/quiz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'Cells use energy to carry out life processes.' }),
    });
    const body = await response.json();
    strict_1.default.equal(response.status, 200);
    strict_1.default.equal(body.mode, 'demo');
    strict_1.default.equal(body.quiz.questions.length, 30);
});
(0, node_test_1.test)('quiz endpoint returns the requested number of demo questions', async () => {
    const response = await fetch(`${baseUrl}/api/ai/quiz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'Cells use energy to carry out life processes.', questionCount: 31 }),
    });
    const body = await response.json();
    strict_1.default.equal(response.status, 200);
    strict_1.default.equal(body.mode, 'demo');
    strict_1.default.equal(body.quiz.questions.length, 31);
    strict_1.default.deepEqual(body.quiz.questions.map((question) => question.id), Array.from({ length: 31 }, (_, index) => index + 1));
});
(0, node_test_1.test)('quiz endpoint rejects question counts below the material minimum', async () => {
    const response = await fetch(`${baseUrl}/api/ai/quiz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'Cells use energy.', questionCount: 2 }),
    });
    const body = await response.json();
    strict_1.default.equal(response.status, 400);
    strict_1.default.equal(body.status, 400);
});
(0, node_test_1.test)('malformed JSON returns a client error in JSON', async () => {
    const response = await fetch(`${baseUrl}/api/ai/explain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{"text":',
    });
    const body = await response.json();
    strict_1.default.equal(response.status, 400);
    strict_1.default.equal(body.status, 400);
    strict_1.default.match(body.error, /valid JSON/i);
});
(0, node_test_1.test)('oversized JSON returns 413', async () => {
    const response = await fetch(`${baseUrl}/api/ai/explain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'x'.repeat(1_100_000) }),
    });
    const body = await response.json();
    strict_1.default.equal(response.status, 413);
    strict_1.default.equal(body.status, 413);
});
(0, node_test_1.test)('invalid AI input returns a validation error', async () => {
    const response = await fetch(`${baseUrl}/api/ai/explain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: '   ' }),
    });
    const body = await response.json();
    strict_1.default.equal(response.status, 400);
    strict_1.default.equal(body.status, 400);
    strict_1.default.match(body.error, /Text is required/);
});
(0, node_test_1.test)('unknown API routes return JSON 404', async () => {
    const response = await fetch(`${baseUrl}/api/not-a-route`);
    const body = await response.json();
    strict_1.default.equal(response.status, 404);
    strict_1.default.equal(body.status, 404);
    strict_1.default.match(body.error, /not found/i);
});
(0, node_test_1.test)('local Vite port 5174 is allowed by CORS', async () => {
    const response = await fetch(`${baseUrl}/api/ai/explain`, {
        method: 'OPTIONS',
        headers: {
            Origin: 'http://localhost:5174',
            'Access-Control-Request-Method': 'POST',
            'Access-Control-Request-Headers': 'content-type',
        },
    });
    strict_1.default.equal(response.status, 204);
    strict_1.default.equal(response.headers.get('access-control-allow-origin'), 'http://localhost:5174');
});
