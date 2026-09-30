import type { Folder, NoteFile } from '../types'

const FOLDERS_KEY = 'inclusive-classroom-note-folders'
const FILES_KEY = 'inclusive-classroom-note-files'

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
  return readList<NoteFile>(FILES_KEY)
}

export function saveNoteFiles(files: NoteFile[]): void {
  localStorage.setItem(FILES_KEY, JSON.stringify(files))
}
