import { useRef, useState, type FormEvent } from 'react'
import { ArrowLeft, ArrowRight, Check, CircleHelp, FileText, FolderOpen, Minus, Plus, RotateCcw, Sparkles, Upload, X } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { ErrorMessage, LoadingSpinner } from '../components/ui'
import SelectFromNotesModal from '../components/SelectFromNotesModal'
import { api } from '../services/api'
import { saveSession } from '../services/storage'
import type { Folder as NoteFolder, NoteFile, QuizQuestion } from '../types'
import { DocumentExtractionError, extractDocumentText, MAX_DOCUMENT_BYTES, MAX_STUDY_TEXT_LENGTH, type ExtractionProgress } from '../services/documentExtraction'
import { calculateMinQuestions, MAX_QUESTION_COUNT, MIN_QUESTION_COUNT } from '../services/quizQuestionCount'

interface QuizLocationState {
  text?: string
  sessionId?: string
}

function summarizeTitle(text: string) {
  return text.trim().split(/\s+/).slice(0, 6).join(' ').slice(0, 52) || 'Quiz practice'
}

export default function QuizPractice() {
  const location = useLocation()
  const routeState = location.state as QuizLocationState | null
  const [text, setText] = useState(routeState?.text ?? '')
  const [minRequiredQuestions, setMinRequiredQuestions] = useState(() => calculateMinQuestions(routeState?.text?.length ?? 0, 'text'))
  const [selectedQuestionCount, setSelectedQuestionCount] = useState(() => calculateMinQuestions(routeState?.text?.length ?? 0, 'text'))
  const [questionCountInput, setQuestionCountInput] = useState(() => String(calculateMinQuestions(routeState?.text?.length ?? 0, 'text')))
  const [sessionId, setSessionId] = useState(routeState?.sessionId)
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [answers, setAnswers] = useState<(number | null)[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isDemoQuiz, setIsDemoQuiz] = useState(false)
  const [error, setError] = useState('')
  const [uploadError, setUploadError] = useState('')
  const [isExtracting, setIsExtracting] = useState(false)
  const [extractionProgress, setExtractionProgress] = useState<ExtractionProgress | null>(null)
  const [documentName, setDocumentName] = useState('')
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false)
  const [noteSource, setNoteSource] = useState<{ folderName: string; noteName: string } | null>(null)
  const [isComplete, setIsComplete] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const currentQuestion = questions[currentIndex]
  const selectedAnswer = answers[currentIndex]
  const score = questions.reduce((total, question, index) => total + (answers[index] === question.correctAnswer ? 1 : 0), 0)

  function updatePastedText(value: string) {
    const nextText = value.slice(0, MAX_STUDY_TEXT_LENGTH)
    const minimum = calculateMinQuestions(nextText.length, 'text')
    setText(nextText)
    setMinRequiredQuestions(minimum)
    setSelectedQuestionCount(minimum)
    setQuestionCountInput(String(minimum))
    setNoteSource(null)
    setDocumentName('')
  }

  function setQuestionCount(value: number) {
    const boundedValue = Math.min(MAX_QUESTION_COUNT, Math.max(minRequiredQuestions, Math.round(value)))
    setSelectedQuestionCount(boundedValue)
    setQuestionCountInput(String(boundedValue))
  }

  function updateQuestionCountInput(value: string) {
    setQuestionCountInput(value)
    const parsedValue = Number(value)
    if (Number.isInteger(parsedValue) && parsedValue >= minRequiredQuestions && parsedValue <= MAX_QUESTION_COUNT) {
      setSelectedQuestionCount(parsedValue)
    }
  }

  async function handleDocument(file?: File) {
    if (!file) return
    setUploadError('')
    setExtractionProgress(null)
    setNoteSource(null)
    setIsExtracting(true)
    try {
      const extracted = await extractDocumentText(file, setExtractionProgress)
      const fileType = file.name.split('.').pop() ?? 'text'
      const minimum = calculateMinQuestions(extracted.length, fileType)
      setText(extracted)
      setMinRequiredQuestions(minimum)
      setSelectedQuestionCount(minimum)
      setQuestionCountInput(String(minimum))
      setDocumentName(file.name)
      setError('')
    } catch (extractionError) {
      setUploadError(extractionError instanceof DocumentExtractionError ? extractionError.message : 'Could not read this document. Check the file and try again.')
    } finally {
      setIsExtracting(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  function selectSavedNote(note: NoteFile, folder: NoteFolder) {
    const noteText = note.extractedText ?? ''
    const minimum = calculateMinQuestions(noteText.length, note.type)
    setText(noteText)
    setMinRequiredQuestions(minimum)
    setSelectedQuestionCount(minimum)
    setQuestionCountInput(String(minimum))
    setDocumentName(note.name)
    setNoteSource({ folderName: folder.name, noteName: note.name })
    setUploadError('')
    setError('')
    setIsNotesModalOpen(false)
  }

  async function generateQuiz(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault()
    if (!text.trim()) {
      setError('Paste a lesson or notes first so the quiz can stay grounded in your material.')
      return
    }

    setError('')
    setIsLoading(true)
    setQuestions([])
    setAnswers([])
    setCurrentIndex(0)
    setIsComplete(false)
    try {
      const result = await api.quiz(text.trim(), selectedQuestionCount)
      if (!result.quiz.questions.length || result.quiz.questions.some((question) => question.options.length !== 4)) {
        throw new Error('The quiz service returned incomplete questions. Please try again.')
      }
      setQuestions(result.quiz.questions)
      setIsDemoQuiz(result.mode === 'demo')
      setAnswers(Array(result.quiz.questions.length).fill(null))
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Quiz generation failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  function chooseAnswer(optionIndex: number) {
    if (selectedAnswer !== null || !currentQuestion) return
    setAnswers((current) => current.map((answer, index) => index === currentIndex ? optionIndex : answer))
  }

  function advance() {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((index) => index + 1)
      return
    }

    const finalScore = questions.reduce((total, question, index) => total + (answers[index] === question.correctAnswer ? 1 : 0), 0)
    const session = saveSession({
      ...(sessionId ? { id: sessionId } : {}),
      title: summarizeTitle(text),
      sourceText: text.trim(),
      quizScore: finalScore,
      quizTotal: questions.length,
    })
    setSessionId(session.id)
    setIsComplete(true)
  }

  function resetQuiz() {
    setQuestions([])
    setAnswers([])
    setCurrentIndex(0)
    setIsComplete(false)
    setError('')
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-7 sm:px-7 lg:px-10 lg:py-10">
      <header className="mb-8">
        <p className="mb-2 text-sm font-bold uppercase tracking-[0.12em] text-emerald-800">Practice & remember</p>
        <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Quiz practice</h1>
        <p className="mt-2 max-w-2xl text-base leading-7 text-slate-600">Check what’s sticking. Every question is built from the material you provide.</p>
      </header>

      {!questions.length && !isLoading && <form onSubmit={generateQuiz} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="mb-4 flex items-start gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800"><CircleHelp aria-hidden="true" className="size-5" /></span><div><h2 className="font-bold text-slate-950">Choose your study material</h2><p className="mt-1 text-sm text-slate-500">{routeState?.text ? 'We brought your material over from the study workspace.' : 'Paste lesson notes or upload a PDF, DOCX, or PPTX file.'}</p></div></div>
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <input ref={fileInputRef} type="file" accept=".pdf,.docx,.pptx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation" onChange={(event) => void handleDocument(event.target.files?.[0])} className="hidden" aria-label="Choose a PDF, DOCX, or PPTX file" />
          <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isExtracting || isLoading} aria-label="Upload a PDF, DOCX, or PPTX file" className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm font-semibold text-emerald-900 hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:cursor-wait disabled:opacity-60"><Upload aria-hidden="true" className="size-4" />Upload PDF, DOCX, PPTX</button>
          <button type="button" onClick={() => setIsNotesModalOpen(true)} aria-label="Select quiz material from saved Notes" className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-900 hover:bg-indigo-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-700"><FolderOpen aria-hidden="true" className="size-4" />Select from saved Notes</button>
          <span className="text-xs text-slate-500">Extracted locally · up to {MAX_DOCUMENT_BYTES / (1024 * 1024)} MB</span>
        </div>
        {isExtracting && <div className="mb-3 rounded-lg border border-emerald-100 bg-emerald-50 p-3" role="status" aria-live="polite"><p className="text-sm font-semibold text-emerald-900">{extractionProgress?.stage ?? 'Preparing document…'}</p><progress className="mt-2 h-2 w-full accent-emerald-700" max="100" value={extractionProgress?.percent ?? 0} aria-label="Document extraction progress" /></div>}
        {uploadError && <div className="mb-3"><ErrorMessage message={uploadError} onDismiss={() => setUploadError('')} /></div>}
        {documentName && <div className="mb-3 flex items-center gap-2 rounded-md bg-slate-100 px-3 py-2 text-sm text-slate-700"><FileText aria-hidden="true" className="size-4 shrink-0" /><span className="truncate">Loaded {documentName}</span></div>}
        {noteSource && <p className="mb-2 rounded-md border border-indigo-100 bg-indigo-50/70 px-3 py-2 text-sm text-indigo-900">Loaded from Notes: {noteSource.folderName} / {noteSource.noteName}</p>}
        <label htmlFor="quiz-source" className="sr-only">Material for quiz</label>
        <textarea id="quiz-source" value={text} onChange={(event) => updatePastedText(event.target.value)} maxLength={MAX_STUDY_TEXT_LENGTH} placeholder="Paste the material you want to practice…" className="min-h-56 w-full resize-y rounded-lg border border-slate-300 bg-slate-50/70 p-4 text-sm leading-6 text-slate-800 outline-none placeholder:text-slate-400 focus:border-emerald-700 focus:bg-white focus:ring-2 focus:ring-emerald-100" />
        <div className="mt-2 flex justify-between text-xs text-slate-500"><span>Up to {MAX_STUDY_TEXT_LENGTH.toLocaleString()} characters</span><span>{text.length.toLocaleString()} / {MAX_STUDY_TEXT_LENGTH.toLocaleString()}</span></div>
        <section className="mt-6 border-t border-slate-100 pt-5" aria-labelledby="question-count-heading">
          <h3 id="question-count-heading" className="text-sm font-bold text-slate-900">Number of Questions</h3>
          <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2" aria-label="Quick select question count">
              {[...new Set([minRequiredQuestions, 50, 100])].map((count) => {
                const isMinimum = count === minRequiredQuestions
                const isSelected = count === selectedQuestionCount
                return <button key={count} type="button" onClick={() => setQuestionCount(count)} aria-label={`Select ${count} questions${isMinimum ? ' minimum' : ''}`} aria-pressed={isSelected} disabled={count < minRequiredQuestions} className={`min-h-10 rounded-full border px-4 py-2 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-40 ${isSelected ? 'border-indigo-700 bg-indigo-700 text-white' : 'border-slate-300 bg-white text-slate-700 hover:border-indigo-300 hover:bg-indigo-50'}`}>
                  {count}{isMinimum ? ' (Min)' : ''}
                </button>
              })}
            </div>

            <div className="flex min-h-11 items-stretch overflow-hidden rounded-lg border border-slate-300 bg-white sm:w-40">
              <button type="button" onClick={() => setQuestionCount(selectedQuestionCount - 1)} disabled={selectedQuestionCount <= minRequiredQuestions} aria-label="Decrease question count" className="inline-flex w-11 shrink-0 items-center justify-center border-r border-slate-200 text-slate-600 hover:bg-slate-50 focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:text-slate-300"><Minus aria-hidden="true" className="size-4" /></button>
              <input id="question-count" type="number" min={minRequiredQuestions} max={MAX_QUESTION_COUNT} step="1" value={questionCountInput} onChange={(event) => updateQuestionCountInput(event.target.value)} onBlur={() => setQuestionCount(selectedQuestionCount)} aria-label="Custom number of questions" className="min-w-0 w-full border-0 bg-transparent px-2 py-2 text-center text-sm font-bold tabular-nums text-slate-900 outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-600" />
              <button type="button" onClick={() => setQuestionCount(selectedQuestionCount + 1)} disabled={selectedQuestionCount >= MAX_QUESTION_COUNT} aria-label="Increase question count" className="inline-flex w-11 shrink-0 items-center justify-center border-l border-slate-200 text-slate-600 hover:bg-slate-50 focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:text-slate-300"><Plus aria-hidden="true" className="size-4" /></button>
            </div>
          </div>
          <p className="mt-3 text-sm leading-5 text-gray-500">We recommend at least {minRequiredQuestions} questions to adequately cover your material. (Minimum: {MIN_QUESTION_COUNT}, Maximum: {MAX_QUESTION_COUNT})</p>
        </section>
        {error && <div className="mt-5"><ErrorMessage message={error} onDismiss={() => setError('')} /></div>}
        <button type="submit" disabled={isLoading || isExtracting || !text.trim()} className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-emerald-800 px-5 py-3 font-bold text-white transition hover:bg-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300"><Sparkles aria-hidden="true" className="size-5" />Generate quiz</button>
      </form>}

      {isLoading && <div className="flex min-h-80 items-center justify-center rounded-xl border border-slate-200 bg-white text-emerald-900 shadow-sm"><LoadingSpinner label="Building questions from your lesson…" /></div>}

      {questions.length > 0 && !isComplete && currentQuestion && <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm" aria-live="polite">
        {isDemoQuiz && <p role="status" className="border-b border-amber-200 bg-amber-50 px-5 py-3 text-sm leading-6 text-amber-950 sm:px-7">Demo mode is using the prewritten Database Normalization quiz. Connect Groq to generate questions from your material.</p>}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-7">
          <div><p className="text-sm font-bold text-emerald-800">Question {currentIndex + 1} <span className="font-medium text-slate-400">of {questions.length}</span></p><div className="mt-2 flex gap-1.5" aria-label={`${currentIndex + 1} of ${questions.length} questions`}>
            {questions.map((question, index) => <span key={question.id} className={`h-1.5 w-8 rounded-full ${index <= currentIndex ? 'bg-emerald-700' : 'bg-slate-200'}`} />)}
          </div></div>
          <button type="button" onClick={resetQuiz} className="inline-flex min-h-9 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"><ArrowLeft aria-hidden="true" className="size-4" />Exit quiz</button>
        </div>

        <div className="px-5 py-7 sm:px-8 sm:py-9">
          <h2 className="max-w-3xl text-xl font-bold leading-8 text-slate-950 sm:text-2xl">{currentQuestion.question}</h2>
          <div className="mt-6 grid gap-3">
            {currentQuestion.options.map((option, index) => {
              const isSelected = selectedAnswer === index
              const isCorrect = currentQuestion.correctAnswer === index
              const showCorrect = selectedAnswer !== null && isCorrect
              const showIncorrect = isSelected && !isCorrect
              const stateClasses = showCorrect
                ? 'border-emerald-600 bg-emerald-50 text-emerald-950'
                : showIncorrect
                  ? 'border-rose-500 bg-rose-50 text-rose-950'
                  : 'border-slate-200 bg-white text-slate-800 hover:border-indigo-300 hover:bg-indigo-50/50'
              return <button key={`${currentQuestion.id}-${option}`} type="button" disabled={selectedAnswer !== null} onClick={() => chooseAnswer(index)} className={`flex min-h-14 w-full items-center gap-4 rounded-lg border p-4 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-default ${stateClasses}`}>
                <span className={`flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${showCorrect ? 'border-emerald-700 bg-emerald-700 text-white' : showIncorrect ? 'border-rose-600 bg-rose-600 text-white' : 'border-slate-300 bg-white text-slate-600'}`}>{showCorrect ? <Check aria-hidden="true" className="size-4" /> : showIncorrect ? <X aria-hidden="true" className="size-4" /> : String.fromCharCode(65 + index)}</span>
                <span className="flex-1 text-sm font-medium leading-6">{option}</span>
                {showCorrect && <span className="text-xs font-bold text-emerald-800">Correct</span>}
                {showIncorrect && <span className="text-xs font-bold text-rose-800">Not quite</span>}
              </button>
            })}
          </div>

          {selectedAnswer !== null && <div className={`mt-5 rounded-lg border p-4 ${selectedAnswer === currentQuestion.correctAnswer ? 'border-emerald-200 bg-emerald-50/80' : 'border-amber-200 bg-amber-50/80'}`}>
            <p className={`text-sm font-bold ${selectedAnswer === currentQuestion.correctAnswer ? 'text-emerald-900' : 'text-amber-950'}`}>{selectedAnswer === currentQuestion.correctAnswer ? 'That’s right.' : `The answer is ${String.fromCharCode(65 + currentQuestion.correctAnswer)}.`}</p>
            <p className="mt-1 text-sm leading-6 text-slate-700">{currentQuestion.explanation}</p>
          </div>}

          <div className="mt-7 flex justify-end">
            <button type="button" disabled={selectedAnswer === null} onClick={advance} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-emerald-800 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300">{currentIndex === questions.length - 1 ? 'See your results' : 'Next question'}<ArrowRight aria-hidden="true" className="size-4" /></button>
          </div>
        </div>
      </section>}

      {isComplete && <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8" aria-live="polite">
        <div className="border-b border-slate-100 pb-6 text-center">
          <span className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-800"><Check aria-hidden="true" className="size-6" /></span>
          <p className="text-sm font-bold uppercase tracking-wider text-emerald-800">Quiz complete</p>
          <h2 className="mt-2 text-3xl font-extrabold text-slate-950">{score} <span className="text-slate-400">/ {questions.length}</span></h2>
          <p className="mt-1 text-sm text-slate-600">{score === questions.length ? 'Excellent recall. You got every question right.' : score >= Math.ceil(questions.length * 0.6) ? 'Good work. Review the missed questions to make them stick.' : 'A useful first pass. Revisit the lesson and give it another try.'}</p>
        </div>
        <div className="mt-5 divide-y divide-slate-100">
          {questions.map((question, index) => {
            const isCorrect = answers[index] === question.correctAnswer
            return <div key={question.id} className="flex gap-3 py-4">
              <span className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full ${isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>{isCorrect ? <Check aria-hidden="true" className="size-4" /> : <X aria-hidden="true" className="size-4" />}</span>
              <div className="min-w-0"><p className="text-sm font-semibold leading-6 text-slate-900">{question.question}</p><p className="mt-1 text-sm leading-6 text-slate-600">{isCorrect ? 'Your answer: ' : 'Correct answer: '}{question.options[isCorrect ? answers[index] as number : question.correctAnswer]}</p></div>
            </div>
          })}
        </div>
        <button type="button" onClick={resetQuiz} className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-800 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"><RotateCcw aria-hidden="true" className="size-4" />Try another quiz</button>
      </section>}

      {error && questions.length > 0 && <div className="mt-5"><ErrorMessage message={error} onDismiss={() => setError('')} /></div>}
      {isNotesModalOpen && <SelectFromNotesModal isOpen={isNotesModalOpen} onClose={() => setIsNotesModalOpen(false)} onSelect={selectSavedNote} />}
    </main>
  )
}