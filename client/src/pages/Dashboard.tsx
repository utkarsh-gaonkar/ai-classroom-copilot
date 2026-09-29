import { useState } from 'react'
import { ArrowRight, BookOpenText, CheckCircle2, Clock3, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getSessions } from '../services/storage'
import type { StudySession } from '../types'

function formatDate(value: string) {
	return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(value))
}

export default function Dashboard() {
	const [sessions] = useState<StudySession[]>(getSessions)
	const recentSessions = sessions.slice(0, 4)

	return (
		<main className="mx-auto w-full max-w-7xl px-4 py-7 sm:px-7 lg:px-10 lg:py-10">
			<header className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
				<div><p className="mb-2 text-sm font-bold uppercase tracking-[0.12em] text-indigo-700">Your learning space</p><h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Good to have you here.</h1><p className="mt-2 text-base leading-7 text-slate-600">Pick up where you left off, or make a little progress on something new.</p></div>
				<Link to="/study" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-indigo-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-700"><Sparkles aria-hidden="true" className="size-4" />Start a study session<ArrowRight aria-hidden="true" className="size-4" /></Link>
			</header>

			<section aria-labelledby="quick-start-heading">
				<div className="mb-4 flex items-center justify-between"><h2 id="quick-start-heading" className="text-lg font-bold text-slate-950">Choose your next step</h2><span className="hidden text-sm text-slate-500 sm:inline">Built around the way you learn</span></div>
				<div className="grid gap-4 md:grid-cols-2">
					<Link to="/study" className="group flex min-h-40 items-center justify-between gap-5 rounded-xl border border-indigo-100 bg-indigo-50/70 p-5 transition hover:border-indigo-300 hover:bg-indigo-50 sm:p-6">
						<div><span className="mb-3 flex size-10 items-center justify-center rounded-lg bg-white text-indigo-700 shadow-sm"><BookOpenText aria-hidden="true" className="size-5" /></span><h3 className="font-bold text-slate-950">Understand a lesson</h3><p className="mt-1 max-w-sm text-sm leading-6 text-slate-600">Get a simpler explanation, listen, or translate your study material.</p></div><ArrowRight aria-hidden="true" className="size-5 shrink-0 text-indigo-700 transition-transform group-hover:translate-x-1" />
					</Link>
					<Link to="/quiz" className="group flex min-h-40 items-center justify-between gap-5 rounded-xl border border-emerald-100 bg-emerald-50/70 p-5 transition hover:border-emerald-300 hover:bg-emerald-50 sm:p-6">
						<div><span className="mb-3 flex size-10 items-center justify-center rounded-lg bg-white text-emerald-800 shadow-sm"><CheckCircle2 aria-hidden="true" className="size-5" /></span><h3 className="font-bold text-slate-950">Check what you know</h3><p className="mt-1 max-w-sm text-sm leading-6 text-slate-600">Turn notes into a short quiz and see what you’re ready to recall.</p></div><ArrowRight aria-hidden="true" className="size-5 shrink-0 text-emerald-800 transition-transform group-hover:translate-x-1" />
					</Link>
				</div>
			</section>

			<section className="mt-9" aria-labelledby="recent-heading">
				<div className="mb-4 flex items-center justify-between"><div><h2 id="recent-heading" className="text-lg font-bold text-slate-950">Recent learning</h2><p className="mt-1 text-sm text-slate-500">Your saved work stays on this device.</p></div>{recentSessions.length > 0 && <span className="text-sm font-medium text-slate-500">{sessions.length} {sessions.length === 1 ? 'session' : 'sessions'}</span>}</div>
				{recentSessions.length === 0 ? <div className="flex flex-col items-center rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center"><span className="mb-3 flex size-11 items-center justify-center rounded-full bg-slate-100 text-slate-600"><Clock3 aria-hidden="true" className="size-5" /></span><p className="font-semibold text-slate-900">Your learning history will show up here</p><p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">Start with a lesson or quiz. Each saved session will be ready when you return.</p><Link to="/study" className="mt-4 text-sm font-bold text-indigo-800 underline decoration-indigo-300 underline-offset-4 hover:text-indigo-950">Open the study workspace</Link></div> : <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white px-5 sm:px-6">{recentSessions.map((session) => <li key={session.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="truncate font-semibold text-slate-900">{session.title}</p><p className="mt-1 text-xs text-slate-500">{formatDate(session.createdAt)}{session.explanation ? ' · Explanation saved' : ''}{session.translation ? ' · Translation saved' : ''}</p></div><div className="flex shrink-0 items-center gap-4">{typeof session.quizScore === 'number' && <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-900">Quiz {session.quizScore}/{session.quizTotal}</span>}<Link to="/study" state={{ sessionId: session.id, text: session.sourceText, explanation: session.explanation, translation: session.translation, translatedLanguage: session.translatedLanguage }} className="inline-flex items-center gap-1 text-sm font-bold text-indigo-800 hover:text-indigo-950">Review<ArrowRight aria-hidden="true" className="size-4" /></Link></div></li>)}</ul>}
			</section>
		</main>
	)
}
