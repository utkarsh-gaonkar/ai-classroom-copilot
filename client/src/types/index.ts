export interface UserPreferences {
	fontSize: number
	highContrast: boolean
	dyslexiaFriendly: boolean
	focusMode: boolean
	reducedMotion: boolean
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

export interface QuizResponse {
	quiz: { questions: QuizQuestion[] }
	mode: 'demo' | 'gemini' | string
}

export interface Folder {
	id: string
	name: string
	createdAt: string
}

export type NoteFileType = 'pdf' | 'doc' | 'docx' | 'ppt' | 'pptx' | 'txt' | 'other'

export interface NoteFile {
	id: string
	folderId: string
	name: string
	type: NoteFileType
	size: number
	uploadDate: string
}

export interface ResourceLink {
	id: string
	title: string
	url: string
	description?: string
	category?: string
	createdAt: string
}
