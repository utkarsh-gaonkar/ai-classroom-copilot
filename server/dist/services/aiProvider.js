"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIProviderError = void 0;
exports.isAIConfigured = isAIConfigured;
exports.generateAIResponse = generateAIResponse;
const GROQ_CHAT_COMPLETIONS_URL = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = 'llama-3.3-70b-versatile';
const REQUEST_TIMEOUT_MS = 30_000;
class AIProviderError extends Error {
    constructor(message) {
        super(message);
        this.name = 'AIProviderError';
    }
}
exports.AIProviderError = AIProviderError;
function isAIConfigured() {
    const key = process.env.GROQ_API_KEY?.trim();
    return Boolean(key && key !== 'your_groq_api_key_here');
}
async function generateAIResponse(prompt, systemInstruction, options = {}) {
    const apiKey = process.env.GROQ_API_KEY?.trim();
    if (!apiKey || apiKey === 'your_groq_api_key_here')
        throw new Error('AI_NOT_CONFIGURED');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
        const response = await fetch(GROQ_CHAT_COMPLETIONS_URL, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: process.env.GROQ_MODEL?.trim() || DEFAULT_MODEL,
                messages: [
                    { role: 'system', content: systemInstruction },
                    { role: 'user', content: prompt },
                ],
                temperature: 0.4,
                max_completion_tokens: 4096,
                ...(options.jsonMode ? { response_format: { type: 'json_object' } } : {}),
            }),
            signal: controller.signal,
        });
        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                throw new AIProviderError('Groq rejected the API credentials. Check GROQ_API_KEY in the backend .env file.');
            }
            if (response.status === 429) {
                throw new AIProviderError('Groq rate limit reached. Wait a moment, then retry.');
            }
            if (response.status === 404) {
                throw new AIProviderError('The configured Groq model is unavailable. Check GROQ_MODEL against Groq’s production models.');
            }
            if (response.status === 413 || response.status === 400) {
                throw new AIProviderError('Groq could not process this request. Try shorter study material or check the configured model.');
            }
            throw new AIProviderError('Groq is temporarily unavailable. Please retry in a moment.');
        }
        let payload;
        try {
            payload = await response.json();
        }
        catch {
            throw new AIProviderError('Groq returned an invalid response. Please retry.');
        }
        if (!payload || typeof payload !== 'object' || !('choices' in payload) || !Array.isArray(payload.choices)) {
            throw new AIProviderError('Groq returned an invalid response. Please retry.');
        }
        const firstChoice = payload.choices[0];
        if (!firstChoice || typeof firstChoice !== 'object' || !('message' in firstChoice)) {
            throw new AIProviderError('Groq returned an empty response. Please retry.');
        }
        const message = firstChoice.message;
        if (!message || typeof message !== 'object' || !('content' in message) || typeof message.content !== 'string' || !message.content.trim()) {
            throw new AIProviderError('Groq returned an empty response. Please retry.');
        }
        const finishReason = 'finish_reason' in firstChoice ? firstChoice.finish_reason : undefined;
        if (finishReason === 'length') {
            throw new AIProviderError('Groq could not finish the response within its output limit. Try shorter study material.');
        }
        return { text: message.content.trim(), mode: 'ai' };
    }
    catch (error) {
        if (error instanceof AIProviderError)
            throw error;
        if (error instanceof Error && error.name === 'AbortError') {
            throw new AIProviderError('Groq took too long to respond. Please retry.');
        }
        throw new AIProviderError('Could not connect to Groq. Check the backend network connection and retry.');
    }
    finally {
        clearTimeout(timeout);
    }
}
