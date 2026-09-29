import { useRef, useState, type FormEvent } from 'react'
import { ArrowRight, BookOpenText, FileText, Languages, Lightbulb, LoaderCircle, Sparkles, Upload, X } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { useLocation, useNavigate } from 'react-router-dom'
import SpeechPlayer from '../components/SpeechPlayer'
import { ErrorMessage, LoadingSpinner } from '../components/ui'
import { usePreferences } from '../hooks/usePreferences'
import { api } from '../services/api'
import { SAMPLE_LESSON } from '../services/sampleContent'
import { saveSession } from '../services/storage'
import { DocumentExtractionError, extractDocumentText, MAX_DOCUMENT_BYTES, MAX_STUDY_TEXT_LENGTH, type ExtractionProgress } from '../services/documentExtraction'
import type { ExplanationLength, ExplanationLevel, ExplanationStyle, Language } from '../types'

const languageOptions: { value: Language; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'Hindi' },
  { value: 'mr', label: 'Marathi' },
  { value: 'kok', label: 'Konkani' },
]

const selectClass = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100'
const fieldClass = 'block text-sm font-semibold text-slate-800'

interface StudyLocationState {
  sessionId?: string
  text?: string
  explanation?: string
  translation?: string
  translatedLanguage?: Language
}

export default function StudyCopilot() {
  const navigate = useNavigate()
  const location = useLocation()
  const { preferences } = usePreferences()
  const routeState = location.state as StudyLocationState | null
  const [text, setText] = useState(routeState?.text ?? '')
  const [level, setLevel] = useState<ExplanationLevel>('school')
  const [style, setStyle] = useState<ExplanationStyle>('summary')
  const [length, setLength] = useState<ExplanationLength>('short')
  const [explanation, setExplanation] = useState(routeState?.explanation ?? '')
  const [translation, setTranslation] = useState(routeState?.translation ?? '')
  const [translatedLanguage, setTranslatedLanguage] = useState<Language | ''>(routeState?.translatedLanguage ?? '')
  const [sessionId, setSessionId] = useState<string | undefined>(routeState?.sessionId)
  const [isExplaining, setIsExplaining] = useState(false)
  const [isTranslating, setIsTranslating] = useState(false)
  const [isDemoExplanation, setIsDemoExplanation] = useState(false)
  const [isDemoTranslation, setIsDemoTranslation] = useState(false)
  const [error, setError] = useState('')
  const [uploadError, setUploadError] = useState('')
  const [isExtracting, setIsExtracting] = useState(false)
  const [extractionProgress, setExtractionProgress] = useState<ExtractionProgress | null>(null)
  const [documentName, setDocumentName] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleExplain(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!text.trim()) {
      setError('Add some study material before asking for an explanation.')
      return
    }

    setError('')
    setIsExplaining(true)
    setExplanation('')
    setTranslation('')
    setTranslatedLanguage('')
    try {
      const result = await api.explain({ text: text.trim(), level, style, length })
      setExplanation(result.explanation)
      setIsDemoExplanation(result.mode === 'demo')
      const session = saveSession({
        ...(sessionId ? { id: sessionId } : {}),
        title: text.trim().split(/\s+/).slice(0, 6).join(' ').slice(0, 52) || 'Study session',
        sourceText: text.trim(),
        explanation: result.explanation,
      })
      setSessionId(session.id)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Explanation failed. Please try again.')
    } finally {
      setIsExplaining(false)
    }
  }

  async function handleTranslate(language: Language | '') {
    setTranslatedLanguage(language)
    setTranslation('')
    if (!language || !explanation) return

    setError('')
    setIsTranslating(true)
    try {
      const result = await api.translate(explanation, language)
      setTranslation(result.translation)
      setIsDemoTranslation(result.mode === 'demo')
      const session = saveSession({
        ...(sessionId ? { id: sessionId } : {}),
        title: text.trim().split(/\s+/).slice(0, 6).join(' ').slice(0, 52) || 'Study session',
        sourceText: text.trim(),
        explanation,
        translation: result.translation,
        translatedLanguage: language,
      })
      setSessionId(session.id)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Translation failed. Please try again.')
      setTranslatedLanguage('')
    } finally {
      setIsTranslating(false)
    }
  }

  function loadSample() {
    setText(SAMPLE_LESSON.content)
    setExplanation('')
    setTranslation('')
    setError('')
    setUploadError('')
    setDocumentName('')
  }

  async function handleDocument(file?: File) {
    if (!file) return
    setUploadError('')
    setExtractionProgress(null)
    setIsExtracting(true)
    try {
      const extracted = await extractDocumentText(file, setExtractionProgress)
      setText(extracted)
      setDocumentName(file.name)
      setExplanation('')
      setTranslation('')
      setTranslatedLanguage('')
      setError('')
    } catch (extractionError) {
      setUploadError(extractionError instanceof DocumentExtractionError ? extractionError.message : 'Could not read this document. Check the file and try again.')
    } finally {
      setIsExtracting(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-7 sm:px-7 lg:px-10 lg:py-10">
      <header className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-sm font-bold uppercase tracking-[0.12em] text-indigo-700">Study workspace</p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Make this lesson yours.</h1>
          <p className="mt-2 max-w-2xl text-base leading-7 text-slate-600">Bring any study material. Get a clearer explanation, hear it aloud, or read it in another language.</p>
        </div>
        {explanation && <button type="button" onClick={() => navigate('/quiz', { state: { text, sessionId } })} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"><BookOpenText aria-hidden="true" className="size-4" />Practice this lesson<ArrowRight aria-hidden="true" className="size-4" /></button>}
      </header>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
        <form onSubmit={handleExplain} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-950">Your study material</h2>
              <p className="mt-1 text-sm text-slate-500">Paste a passage, notes, or a topic you want to understand.</p>
            </div>
            <button type="button" onClick={loadSample} className="inline-flex min-h-9 shrink-0 items-center gap-2 rounded-lg border border-indigo-200 px-3 py-2 text-xs font-bold text-indigo-800 hover:bg-indigo-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"><BookOpenText aria-hidden="true" className="size-4" /><span className="hidden sm:inline">Load sample lesson</span><span className="sm:hidden">Sample</span></button>
          </div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <input ref={fileInputRef} type="file" accept=".txt,.pdf,.docx,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={(event) => void handleDocument(event.target.files?.[0])} className="sr-only" aria-label="Choose a text, PDF, or DOCX file" />
            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isExtracting} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-wait disabled:opacity-60"><Upload aria-hidden="true" className="size-4" />Upload text, PDF, DOCX</button>
            <span className="text-xs text-slate-500">Files are extracted in your browser (max {MAX_DOCUMENT_BYTES / (1024 * 1024)} MB).</span>
          </div>
          {isExtracting && <div className="mb-3 rounded-lg border border-indigo-100 bg-indigo-50 p-3" role="status" aria-live="polite"><div className="flex items-center gap-2 text-sm font-semibold text-indigo-900"><LoaderCircle aria-hidden="true" className="size-4 animate-spin" />{extractionProgress?.stage ?? 'Preparing document…'}</div><progress className="mt-2 h-2 w-full accent-indigo-700" max="100" value={extractionProgress?.percent ?? 0} aria-label="Document extraction progress" /></div>}
          {uploadError && <div className="mb-3"><ErrorMessage message={uploadError} onDismiss={() => setUploadError('')} /></div>}
          {documentName && <div className="mb-3 flex items-center justify-between gap-3 rounded-md bg-slate-100 px-3 py-2 text-sm text-slate-700"><span className="flex min-w-0 items-center gap-2"><FileText aria-hidden="true" className="size-4 shrink-0" /><span className="truncate">{documentName}</span></span><button type="button" onClick={() => setDocumentName('')} className="rounded p-1 hover:bg-slate-200 focus-visible:outline-2 focus-visible:outline-indigo-600" aria-label="Dismiss document name"><X aria-hidden="true" className="size-4" /></button></div>}
          <label htmlFor="study-material" className="sr-only">Study material preview and editor</label>
          <textarea id="study-material" value={text} onChange={(event) => setText(event.target.value.slice(0, MAX_STUDY_TEXT_LENGTH))} maxLength={MAX_STUDY_TEXT_LENGTH} placeholder="Paste your lesson notes here, or upload a text, PDF, or DOCX file…" className="min-h-60 w-full resize-y rounded-lg border border-slate-300 bg-slate-50/70 p-4 text-sm leading-6 text-slate-800 outline-none placeholder:text-slate-400 focus:border-indigo-600 focus:bg-white focus:ring-2 focus:ring-indigo-100" />
          <div className="mt-2 flex justify-between text-xs text-slate-500"><span>Extracted text stays here for review and editing before use.</span><span>{text.length.toLocaleString()} / {MAX_STUDY_TEXT_LENGTH.toLocaleString()}</span></div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div><label htmlFor="level" className={`${fieldClass} mb-2`}>Learning level</label><select id="level" value={level} onChange={(event) => setLevel(event.target.value as ExplanationLevel)} className={selectClass}><option value="very-simple">Very simple</option><option value="school">School</option><option value="college">College</option></select></div>
            <div><label htmlFor="style" className={`${fieldClass} mb-2`}>Explanation style</label><select id="style" value={style} onChange={(event) => setStyle(event.target.value as ExplanationStyle)} className={selectClass}><option value="summary">Summary</option><option value="step-by-step">Step by step</option><option value="examples">Examples</option></select></div>
            <div><label htmlFor="length" className={`${fieldClass} mb-2`}>Answer length</label><select id="length" value={length} onChange={(event) => setLength(event.target.value as ExplanationLength)} className={selectClass}><option value="short">Short</option><option value="detailed">Detailed</option></select></div>
          </div>

          {error && <div className="mt-5"><ErrorMessage message={error} onDismiss={() => setError('')} /></div>}
          <button type="submit" disabled={isExplaining || !text.trim()} className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-indigo-700 px-5 py-3 font-bold text-white transition hover:bg-indigo-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"><Sparkles aria-hidden="true" className="size-5" />{isExplaining ? <LoadingSpinner label="Finding a clear explanation…" /> : 'Explain simply'}</button>
          <p className="mt-3 text-center text-xs text-slate-500">Your material stays in this browser session.</p>
        </form>

        <section className="min-h-96 rounded-xl border border-slate-200 bg-white shadow-sm" aria-live="polite" aria-busy={isExplaining || isTranslating}>
          <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
            <div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-lg bg-amber-50 text-amber-700"><Lightbulb aria-hidden="true" className="size-5" /></span><div><h2 className="font-bold text-slate-950">Your explanation</h2><p className="text-xs text-slate-500">A clearer way into the topic</p></div></div>
          </div>

          {!explanation && !isExplaining ? <div className="flex min-h-72 flex-col items-center justify-center px-8 text-center"><span className="mb-4 flex size-14 items-center justify-center rounded-full bg-indigo-50 text-indigo-700"><Sparkles aria-hidden="true" className="size-6" /></span><p className="font-semibold text-slate-800">Your explanation will appear here</p><p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">Choose how you like to learn, then ask your copilot to unpack the material.</p></div> : null}
          {isExplaining && <div className="flex min-h-72 items-center justify-center text-indigo-800"><LoadingSpinner label="Working through your lesson…" /></div>}
          {explanation && <div className="p-5 sm:p-6">{isDemoExplanation && <p role="status" className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950">Demo mode is using prewritten sample content. Connect Groq to generate an explanation from your material.</p>}<SpeechPlayer text={explanation} language="en" /><article className="markdown-content mt-5 max-w-none"><ReactMarkdown>{explanation}</ReactMarkdown></article>
            <div className="mt-7 border-t border-slate-100 pt-5">
              <label htmlFor="translation-language" className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-900"><Languages aria-hidden="true" className="size-4 text-indigo-700" />Read in another language</label>
              <select id="translation-language" value={translatedLanguage} onChange={(event) => void handleTranslate(event.target.value as Language | '')} className={`${selectClass} max-w-sm`}>
                <option value="">Choose a language</option>
                {languageOptions.map((option) => <option key={option.value} value={option.value}>{option.label}{preferences.defaultLanguage === option.value ? ' (default)' : ''}</option>)}
              </select>
              {isTranslating && <div className="mt-4 text-sm text-indigo-800"><LoadingSpinner label="Translating your explanation…" /></div>}
              {translation && <div className="mt-5 rounded-lg border border-teal-200 bg-teal-50/60 p-4 sm:p-5">{isDemoTranslation && <p role="status" className="mb-4 rounded-md bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-950">Demo mode is showing a prewritten sample translation.</p>}<h3 className="mb-3 font-bold text-slate-950">{languageOptions.find((option) => option.value === translatedLanguage)?.label} translation</h3><SpeechPlayer text={translation} label="Listen to translation" language={translatedLanguage || 'en'} /><article className="markdown-content mt-4 max-w-none"><ReactMarkdown>{translation}</ReactMarkdown></article></div>}
            </div>
          </div>}
        </section>
      </div>
    </main>
  )
}