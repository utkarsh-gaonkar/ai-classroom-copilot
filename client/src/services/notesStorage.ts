import type { Folder, NoteFile } from '../types'

const FOLDERS_KEY = 'inclusive-classroom-note-folders'
const FILES_KEY = 'inclusive-classroom-note-files'

export class NotesStorageQuotaError extends Error {
  constructor() {
    super('Browser storage is full. Remove saved notes or try a smaller file before uploading again.')
    this.name = 'NotesStorageQuotaError'
  }
}

function readList<T>(key: string): T[] {
  try {
    const saved = localStorage.getItem(key)
    const value: unknown = saved ? JSON.parse(saved) : []
    return Array.isArray(value) ? value as T[] : []
  } catch {
    return []
  }
}

export function getNoteFolders(): Folder[] {
  return readList<Folder>(FOLDERS_KEY)
}

export function saveNoteFolders(folders: Folder[]): void {
  localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders))
}

export function getNoteFiles(): NoteFile[] {
  return readList<(NoteFile & { textContent?: string })>(FILES_KEY).map(({ textContent, ...note }) => ({
    ...note,
    extractedText: note.extractedText ?? textContent,
  }))
}

export function saveNoteFiles(files: NoteFile[]): void {
  try {
    localStorage.setItem(FILES_KEY, JSON.stringify(files))
  } catch (error) {
    const isQuotaExceeded = error instanceof DOMException
      ? error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED'
      : false
    if (isQuotaExceeded) throw new NotesStorageQuotaError()
    throw error
  }
}
