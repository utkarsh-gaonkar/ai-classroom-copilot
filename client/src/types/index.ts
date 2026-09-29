export type Language = 'en' | 'hi' | 'mr' | 'kok'

export interface UserPreferences {
	fontSize: number
	highContrast: boolean
	reducedMotion: boolean
	defaultLanguage: Language
	speechRate: number
	speechVoiceURI: string
}

export type ExplanationLevel = 'very-simple' | 'school' | 'college'
export type ExplanationStyle = 'summary' | 'step-by-step' | 'examples'
export type ExplanationLength = 'short' | 'detailed'

export interface QuizQuestion {
	id: number
	question: string
	options: string[]
	correctAnswer: number
	explanation: string
}

export interface StudySession {
	id: string
	title: string
	createdAt: string
	sourceText: string
	explanation?: string
	translation?: string
	translatedLanguage?: Language
	quizScore?: number
	quizTotal?: number
}

export interface ExplainRequest {
	text: string
	level: ExplanationLevel
	style: ExplanationStyle
	length: ExplanationLength
}

export interface ExplainResponse {
	explanation: string
	mode: 'demo' | 'gemini' | string
}

export interface TranslateResponse {
	translation: string
	mode: 'demo' | 'gemini' | string
	targetLang: Language
}

export interface QuizResponse {
	quiz: { questions: QuizQuestion[] }
	mode: 'demo' | 'gemini' | string
}
