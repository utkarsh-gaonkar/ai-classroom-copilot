import { BookOpenText, GraduationCap, LayoutDashboard, Settings, Sparkles } from 'lucide-react'
import { Link, NavLink, Outlet } from 'react-router-dom'

const navigation = [
	{ to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
	{ to: '/study', label: 'Study workspace', icon: BookOpenText },
	{ to: '/quiz', label: 'Quiz practice', icon: Sparkles },
	{ to: '/settings', label: 'Preferences', icon: Settings },
]

export default function Layout() {
	return (
		<div className="min-h-screen bg-[#f7f8fc] text-slate-900 lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
			<aside className="hidden border-r border-slate-200 bg-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col">
				<Link to="/" className="flex h-19 items-center gap-3 border-b border-slate-100 px-6" aria-label="Inclusive Classroom Copilot home">
					<span className="flex size-10 items-center justify-center rounded-xl bg-indigo-700 text-white"><GraduationCap aria-hidden="true" className="size-6" /></span>
					<span><span className="block text-sm font-extrabold leading-5 text-slate-950">Classroom Copilot</span><span className="block text-xs text-slate-500">Inclusive learning</span></span>
				</Link>
				<nav aria-label="Main navigation" className="flex-1 space-y-1 px-3 py-6">
					<p className="mb-3 px-3 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">Workspace</p>
					  {navigation.map(({ to, label, icon: Icon, end }) => <NavLink key={to} to={to} end={end} className={({ isActive }) => `flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${isActive ? 'bg-indigo-50 text-indigo-800' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'}`}><Icon aria-hidden="true" className="size-4.5" />{label}</NavLink>)}
				</nav>
				<div className="mx-4 mb-5 rounded-lg bg-emerald-50 p-4">
					<p className="text-sm font-bold text-emerald-950">Learn at your pace</p>
					<p className="mt-1 text-xs leading-5 text-emerald-900/75">Simple explanations, speech, and translation in one calm space.</p>
				</div>
				<div className="border-t border-slate-100 px-6 py-4 text-xs text-slate-500">Built for every kind of learner</div>
			</aside>

			<div className="flex min-h-screen min-w-0 flex-col">
				<div className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur lg:hidden">
					  <Link to="/" className="flex items-center gap-2.5" aria-label="Classroom Copilot home"><span className="flex size-8 items-center justify-center rounded-lg bg-indigo-700 text-white"><GraduationCap aria-hidden="true" className="size-5" /></span><span className="text-sm font-extrabold text-slate-950">Classroom Copilot</span></Link>
					<span className="text-xs font-semibold text-emerald-800">Inclusive learning</span>
				</div>
				<div className="min-w-0 flex-1 pb-20 lg:pb-0"><Outlet /></div>
				<nav aria-label="Main navigation" className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 border-t border-slate-200 bg-white/95 px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 backdrop-blur lg:hidden">
					{navigation.map(({ to, label, icon: Icon, end }) => <NavLink key={to} to={to} end={end} className={({ isActive }) => `flex min-h-14 flex-col items-center justify-center gap-1 rounded-md px-1 text-[10px] font-semibold ${isActive ? 'text-indigo-800' : 'text-slate-500'}`}><Icon aria-hidden="true" className="size-5" /><span>{label}</span></NavLink>)}
				</nav>
			</div>
		</div>
	)
}
