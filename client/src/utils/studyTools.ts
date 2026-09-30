export interface StudyGlossaryItem {
  term: string
  definition: string
}

export interface StudyFlashcard {
  front: string
  back: string
}

const STOP_WORDS = new Set([
  'about', 'after', 'again', 'against', 'also', 'because', 'between', 'could', 'every', 'from',
  'having', 'into', 'more', 'other', 'should', 'their', 'there', 'these', 'through', 'under',
  'using', 'what', 'when', 'where', 'which', 'while', 'with', 'would', 'this', 'that', 'them',
  'than', 'then', 'your', 'were', 'very', 'have', 'been', 'will', 'into', 'each', 'most', 'some',
  'such', 'only', 'just', 'does', 'made', 'over', 'same', 'than', 'take', 'show', 'help', 'idea',
  'many', 'part', 'time', 'topic', 'study', 'learn', 'notes', 'lesson', 'example', 'material'
])

function normalizeText(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

function toSentenceList(value: string): string[] {
  return normalizeText(value)
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 18)
}

function createTermDefinition(term: string): string {
  const readable = term.replace(/[-_]/g, ' ')
  const base = readable.length > 12 ? readable.slice(0, 12).trim() : readable
  return `The term “${readable}” is a key idea in this lesson. It helps explain the main concept and connects to the broader topic being studied. A simple way to remember it is to link it to ${base || 'the central example'} in your notes.`
}

export function buildGlossary(text: string, maxTerms = 6): StudyGlossaryItem[] {
  const cleaned = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ')
  const counts = new Map<string, number>()

  for (const word of cleaned.split(/\s+/)) {
    const normalized = word.replace(/[^a-z]/g, '')
    if (!normalized || normalized.length < 5 || STOP_WORDS.has(normalized)) continue
    counts.set(normalized, (counts.get(normalized) ?? 0) + 1)
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxTerms)
    .map(([term, _count]) => ({
      term: term.charAt(0).toUpperCase() + term.slice(1),
      definition: createTermDefinition(term)
    }))
}

export function buildFlashcards(text: string, maxCards = 4): StudyFlashcard[] {
  const sentences = toSentenceList(text)
  if (!sentences.length) {
    return [{ front: 'What is the main idea of this lesson?', back: 'Review the material and focus on the key point the lesson is trying to explain.' }]
  }

  return sentences.slice(0, maxCards).map((sentence, index) => {
    const keyPhrase = sentence.replace(/\s+/g, ' ').slice(0, 72)
    return {
      front: index === 0 ? 'What is the main idea in this lesson?' : `What does this sentence help explain?`,
      back: keyPhrase.length >= 72 ? `${keyPhrase}…` : keyPhrase
    }
  })
}

export function buildRecallPrompts(text: string, maxPrompts = 4): string[] {
  const sentences = toSentenceList(text)
  if (!sentences.length) {
    return ['Explain the main idea in your own words.', 'List two supporting details from the lesson.']
  }

  return sentences.slice(0, maxPrompts).map((sentence, index) => {
    const short = sentence.replace(/\s+/g, ' ').slice(0, 100)
    return index === 0
      ? `Explain the main idea behind: “${short}” in your own words.`
      : `What key detail supports this idea: “${short}”?`
  })
}
