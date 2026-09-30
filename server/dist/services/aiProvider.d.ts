interface AIResponse {
    text: string;
    mode: 'ai' | 'demo';
}
export declare class AIProviderError extends Error {
    constructor(message: string);
}
export declare function isAIConfigured(): boolean;
export declare function generateAIResponse(prompt: string, systemInstruction: string, options?: {
    jsonMode?: boolean;
    questionCount?: number;
}): Promise<AIResponse>;
export {};
