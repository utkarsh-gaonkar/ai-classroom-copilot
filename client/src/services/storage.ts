import type { StudySession } from '../types'

const SESSION_KEY = 'inclusive-classroom-sessions'

export function getSessions(): StudySession[] {
	try {
		const value = localStorage.getItem(SESSION_KEY)
		return value ? JSON.parse(value) as StudySession[] : []
	} catch {
		return []
	}
}

export function saveSession(
	changes: Omit<StudySession, 'id' | 'createdAt'> & Partial<Pick<StudySession, 'id' | 'createdAt'>>,
): StudySession {
	const sessions = getSessions()
	const existing = changes.id ? sessions.find((session) => session.id === changes.id) : undefined
	const session: StudySession = {
		...existing,
		...changes,
		id: existing?.id ?? changes.id ?? crypto.randomUUID(),
		createdAt: existing?.createdAt ?? changes.createdAt ?? new Date().toISOString(),
	}
	const next = [session, ...sessions.filter((item) => item.id !== session.id)]
	localStorage.setItem(SESSION_KEY, JSON.stringify(next))
	return session
}
