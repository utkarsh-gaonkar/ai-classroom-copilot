import { Pause, Play, RotateCcw, Square, Volume2, VolumeX } from 'lucide-react'
import { useId, useState } from 'react'
import { usePreferences } from '../hooks/usePreferences'
import { useSpeech } from '../hooks/useSpeech'

export default function SpeechPlayer({ text, label = 'Listen' }: { text: string; label?: string }) {
	const id = useId()
	const { preferences, updatePreferences } = usePreferences()
	const { voices, status, section, sectionCount, sectionText, message, speak, pause, resume, stop, setRate, isSupported } = useSpeech()
	const [notice, setNotice] = useState('')
	const voice = voices.find((candidate) => candidate.voiceURI === preferences.speechVoiceURI)
	const isActive = status === 'playing' || status === 'paused'

	function startReading() {
		setNotice('')
		speak(text, preferences.speechRate, preferences.speechVoiceURI)
	}

	if (!isSupported) return (
		<div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
			<p className="flex items-center gap-2 font-semibold"><VolumeX aria-hidden="true" className="size-4" />Speech playback is unavailable in this browser.</p>
			<p className="mt-2">The complete text remains available to read on this page. Browser and installed-voice support varies by device.</p>
		</div>
	)

	return (
		<section className="rounded-lg border border-indigo-100 bg-indigo-50/60 p-4" aria-label={`${label} reading controls`}>
			<div className="flex flex-wrap items-start justify-between gap-3">
				<div className="min-w-0">
					<p className="flex items-center gap-2 text-sm font-bold text-slate-950"><Volume2 aria-hidden="true" className="size-4 text-indigo-700" />Listen to this text</p>
					<p className="mt-1 text-sm text-slate-700" role="status" aria-live="polite">
						{status === 'playing' ? `Reading section ${section} of ${sectionCount}` : status === 'paused' ? `Paused at section ${section} of ${sectionCount}` : status === 'error' ? message : message || 'Ready to read aloud'}
					</p>
				</div>
				<div className="flex shrink-0 items-center gap-2">
					{status !== 'playing' && <button type="button" onClick={startReading} disabled={!text.trim()} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-indigo-700 px-3 py-2 text-sm font-bold text-white hover:bg-indigo-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300" aria-label={status === 'error' || (status === 'idle' && message === 'Reading complete.') ? 'Restart reading' : label}>
						{status === 'error' || (status === 'idle' && message === 'Reading complete.') ? <RotateCcw aria-hidden="true" className="size-4" /> : <Play aria-hidden="true" className="size-4" />}
						{status === 'error' || (status === 'idle' && message === 'Reading complete.') ? 'Restart' : label}
					</button>}
					{status === 'playing' && <button type="button" onClick={pause} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-indigo-700 px-3 py-2 text-sm font-bold text-white hover:bg-indigo-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-700" aria-label="Pause reading"><Pause aria-hidden="true" className="size-4" />Pause</button>}
					{status === 'paused' && <button type="button" onClick={resume} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-indigo-700 px-3 py-2 text-sm font-bold text-white hover:bg-indigo-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-700" aria-label="Resume reading"><Play aria-hidden="true" className="size-4" />Resume</button>}
					{isActive && <button type="button" onClick={stop} className="inline-flex size-10 items-center justify-center rounded-lg border border-indigo-200 bg-white text-indigo-900 hover:bg-indigo-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-700" aria-label="Stop reading"><Square aria-hidden="true" className="size-4" /></button>}
				</div>
			</div>

			{status === 'playing' && sectionText && <p className="mt-3 line-clamp-2 rounded-md border border-indigo-100 bg-white/80 px-3 py-2 text-xs leading-5 text-slate-600">Current section: {sectionText.trim()}</p>}

			<div className="mt-4 grid gap-4 border-t border-indigo-100 pt-4 sm:grid-cols-2">
				<div>
					<label htmlFor={`speech-voice-${id}`} className="mb-1.5 block text-xs font-bold text-slate-700">Browser voice</label>
					<select id={`speech-voice-${id}`} value={voice ? preferences.speechVoiceURI : ''} onChange={(event) => updatePreferences({ speechVoiceURI: event.target.value })} disabled={voices.length === 0 || isActive} className="min-h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-100" aria-describedby={`speech-voice-help-${id}`}>
						<option value="">Automatic English match</option>
						{voices.map((availableVoice) => <option key={availableVoice.voiceURI} value={availableVoice.voiceURI}>{availableVoice.name} ({availableVoice.lang}){availableVoice.default ? ' · system default' : ''}</option>)}
					</select>
					<p id={`speech-voice-help-${id}`} className="mt-1 text-xs leading-5 text-slate-600">{voices.length ? `Selected: ${voice?.name ?? 'automatic English match'}.` : 'Waiting for this browser to report its installed voices.'}</p>
				</div>
				<div>
					<div className="mb-1.5 flex items-center justify-between gap-2"><label htmlFor={`speech-rate-${id}`} className="text-xs font-bold text-slate-700">Speech speed</label><output htmlFor={`speech-rate-${id}`} className="text-xs font-bold tabular-nums text-indigo-800">{preferences.speechRate.toFixed(1)}x</output></div>
					<input id={`speech-rate-${id}`} type="range" min="0.5" max="2" step="0.1" value={preferences.speechRate} onChange={(event) => { const rate = Number(event.target.value); updatePreferences({ speechRate: rate }); setRate(rate); setNotice(isActive ? 'The current spoken section keeps its rate; the new speed applies to the next section.' : '') }} className="mt-1 h-2 w-full cursor-pointer accent-indigo-700" />
					<div className="flex justify-between text-xs text-slate-600"><span>0.5x</span><span>2x</span></div>
				</div>
			</div>

			{(message || notice) && <p className="mt-3 rounded-md bg-white/80 px-3 py-2 text-xs leading-5 text-slate-700">{notice || message}</p>}
			<p className="mt-3 text-xs leading-5 text-slate-600">Voice availability and pronunciation depend on your browser, operating system, and installed voices. No word-level highlighting is provided. The complete text remains available above to read at your own pace.</p>
		</section>
	)
}
