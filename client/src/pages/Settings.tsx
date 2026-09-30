import { Check, Contrast, Minus, Plus, Settings2, Volume2, Waves } from 'lucide-react'
import { usePreferences } from '../hooks/usePreferences'

function PreferenceToggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  description: string
}) {
  return (
    <div className="flex items-center justify-between gap-5 py-5">
      <div>
        <p className="font-semibold text-slate-900">{label}</p>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 ${checked ? 'bg-indigo-600' : 'bg-slate-300'}`}
      >
        <span className={`inline-flex size-5 items-center justify-center rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`}>
          {checked && <Check aria-hidden="true" className="size-3 text-indigo-700" />}
        </span>
      </button>
    </div>
  )
}

export default function Settings() {
  const { preferences, updatePreferences } = usePreferences()

  return (
    <main className="mx-auto w-full max-w-4xl px-5 py-8 sm:px-8 lg:py-12">
      <header className="mb-9">
        <p className="mb-2 text-sm font-bold uppercase tracking-[0.12em] text-indigo-700">Your learning space</p>
        <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Accessibility & preferences</h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">Shape the classroom around the way you learn. Your choices are saved on this device and take effect right away.</p>
      </header>

      <div className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white px-5 shadow-sm sm:px-8">
        <section className="py-6" aria-labelledby="reading-heading">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700"><Settings2 aria-hidden="true" className="size-5" /></span>
            <div>
              <h2 id="reading-heading" className="text-lg font-bold text-slate-900">Reading comfort</h2>
              <p className="text-sm text-slate-500">Adjust the text and visual contrast.</p>
            </div>
          </div>
          <div className="py-4">
            <div className="mb-3 flex items-center justify-between gap-4">
              <label htmlFor="font-size" className="font-semibold text-slate-900">Font size</label>
              <output htmlFor="font-size" className="min-w-14 rounded-md bg-indigo-50 px-2 py-1 text-center text-sm font-bold tabular-nums text-indigo-800">{preferences.fontSize}px</output>
            </div>
            <div className="flex items-center gap-3">
              <Minus aria-hidden="true" className="size-4 text-slate-500" />
              <input id="font-size" type="range" min="12" max="24" step="1" value={preferences.fontSize} onChange={(event) => updatePreferences({ fontSize: Number(event.target.value) })} className="h-2 w-full cursor-pointer accent-indigo-600" />
              <Plus aria-hidden="true" className="size-4 text-slate-500" />
            </div>
            <div className="mt-1 flex justify-between pl-7 text-xs text-slate-500"><span>12px</span><span>24px</span></div>
          </div>
          <PreferenceToggle checked={preferences.highContrast} onChange={(highContrast) => updatePreferences({ highContrast })} label="High contrast mode" description="Strengthen text and interface contrast for easier reading." />
          <PreferenceToggle checked={preferences.dyslexiaFriendly} onChange={(dyslexiaFriendly) => updatePreferences({ dyslexiaFriendly })} label="Dyslexia-friendly reading" description="Use a calmer, open reading style with better spacing and a supportive font." />
          <PreferenceToggle checked={preferences.focusMode} onChange={(focusMode) => updatePreferences({ focusMode })} label="Reading focus mode" description="Reduce visual distractions so one idea stands out at a time." />
          <PreferenceToggle checked={preferences.reducedMotion} onChange={(reducedMotion) => updatePreferences({ reducedMotion })} label="Reduce motion" description="Minimize transitions and movement throughout the app." />
        </section>

        <section className="py-7" aria-label="Speech preferences">
          <div className="w-full">
            <div className="mb-2 flex items-center justify-between gap-3">
              <label htmlFor="speech-rate" className="flex items-center gap-2 font-semibold text-slate-900"><Volume2 aria-hidden="true" className="size-4 text-indigo-700" />Speech rate</label>
              <output htmlFor="speech-rate" className="text-sm font-bold tabular-nums text-indigo-800">{preferences.speechRate.toFixed(1)}x</output>
            </div>
            <p className="mb-3 text-sm text-slate-500">Set the pace for spoken explanations.</p>
            <div className="flex items-center gap-3">
              <Waves aria-hidden="true" className="size-4 text-slate-500" />
              <input id="speech-rate" type="range" min="0.5" max="2" step="0.1" value={preferences.speechRate} onChange={(event) => updatePreferences({ speechRate: Number(event.target.value) })} className="h-2 w-full cursor-pointer accent-indigo-600" />
            </div>
            <div className="mt-1 flex justify-between pl-7 text-xs text-slate-500"><span>0.5x</span><span>2x</span></div>
          </div>
        </section>
      </div>

      <div className="mt-4 flex items-center gap-2 text-sm text-slate-500"><Contrast aria-hidden="true" className="size-4" />Preferences are stored locally in your browser.</div>
    </main>
  )
}