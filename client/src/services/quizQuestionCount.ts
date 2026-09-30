export const MIN_QUESTION_COUNT = 30
export const MAX_QUESTION_COUNT = 200

export function calculateMinQuestions(textLength: number, fileType: string): number {
  const normalizedType = fileType.trim().toLowerCase().replace(/^\./, '')
  const charactersPerQuestion = ['pdf', 'doc', 'docx'].includes(normalizedType)
    ? 1_500
    : ['ppt', 'pptx'].includes(normalizedType)
      ? 500
      : 1_000
  const safeLength = Number.isFinite(textLength) ? Math.max(0, textLength) : 0
  const calculated = Math.max(MIN_QUESTION_COUNT, Math.ceil(safeLength / charactersPerQuestion))
  return Math.min(MAX_QUESTION_COUNT, calculated)
}
