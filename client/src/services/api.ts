import type { ExplainRequest, ExplainResponse, QuizResponse } from '../types'

const configuredApiUrl = import.meta.env.VITE_API_URL?.trim() || '/api'
const API_BASE_URL = `${configuredApiUrl.replace(/\/+$/, '').replace(/\/api$/i, '')}/api`

async function post<T>(path: string, body: unknown): Promise<T> {
	let response: Response
	try {
		response = await fetch(`${API_BASE_URL}/ai/${path}`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body),
		})
	} catch {
		throw new Error('The classroom service could not be reached. Check that the backend is running and try again.')
	}

	const payload = await response.json().catch(() => ({})) as { error?: string }
	if (!response.ok) throw new Error(payload.error || 'Something went wrong. Please try again.')
	return payload as T
}

export const api = {
	explain: (request: ExplainRequest) => post<ExplainResponse>('explain', request),
	quiz: (text: string, questionCount: number) => post<QuizResponse>('quiz', { text, questionCount }),
}
