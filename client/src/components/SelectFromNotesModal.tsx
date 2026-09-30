import { useEffect, useRef, useState } from 'react'
import { FileText, Folder, Search, X } from 'lucide-react'
import type { Folder as NoteFolder, NoteFile } from '../types'
import { getNoteFiles, getNoteFolders } from '../services/notesStorage'

interface SelectFromNotesModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (note: NoteFile, folder: NoteFolder) => void
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value))
}

export default function SelectFromNotesModal({ isOpen, onClose, onSelect }: SelectFromNotesModalProps) {
  const [folders] = useState<NoteFolder[]>(getNoteFolders)
  const [files] = useState<NoteFile[]>(getNoteFiles)
  const [search, setSearch] = useState('')
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const dialogRef = useRef<HTMLElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isOpen) return
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    searchRef.current?.focus()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }
      if (event.key !== 'Tab') return

      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      )
      if (!focusable?.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      previousFocus?.focus()
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const query = search.trim().toLocaleLowerCase()
  const visibleFiles = files.filter((file) => {
    const folder = folders.find((item) => item.id === file.folderId)
    const matchesFolder = selectedFolderId === null || file.folderId === selectedFolderId
    const matchesSearch = !query || file.name.toLocaleLowerCase().includes(query) || folder?.name.toLocaleLowerCase().includes(query)
    return matchesFolder && matchesSearch
  })

  return (
    <div className="fixed inset-x-0 top-0 bottom-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/45 p-4 sm:items-center" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="select-note-heading" className="my-auto flex max-h-[calc(100vh-2rem)] w-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl" style={{ maxWidth: '56rem' }}>
        <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
          <div><h2 id="select-note-heading" className="text-lg font-bold text-slate-950">Select from saved Notes</h2><p className="mt-1 text-sm text-slate-500">Choose a saved note to load its extracted text.</p></div>
          <button type="button" onClick={onClose} aria-label="Close saved notes selector" className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-indigo-600"><X aria-hidden="true" className="size-4" /></button>
        </header>

        <div className="border-b border-slate-100 p-4 sm:px-6">
          <label htmlFor="saved-note-search" className="sr-only">Search saved notes</label>
          <div className="relative"><Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><input ref={searchRef} id="saved-note-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search folders and notes" aria-label="Search saved notes by name" className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100" /></div>
        </div>

        <div className="grid min-h-0 flex-1 gap-4 overflow-hidden p-4 sm:grid-cols-[12rem_minmax(0,1fr)] sm:p-5">
          <nav aria-label="Saved note folders" className="flex gap-2 overflow-x-auto sm:flex-col sm:overflow-y-auto sm:border-r sm:border-slate-100 sm:pr-4">
            <button type="button" onClick={() => setSelectedFolderId(null)} aria-current={selectedFolderId === null ? 'page' : undefined} className={`min-h-10 shrink-0 rounded-lg px-3 py-2 text-left text-sm font-semibold focus-visible:outline-2 focus-visible:outline-indigo-600 ${selectedFolderId === null ? 'bg-indigo-50 text-indigo-900' : 'text-slate-600 hover:bg-slate-50'}`}>All folders</button>
            {folders.map((folder) => <button key={folder.id} type="button" onClick={() => setSelectedFolderId(folder.id)} aria-current={selectedFolderId === folder.id ? 'page' : undefined} aria-label={`Show notes in ${folder.name}`} className={`flex min-h-10 shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold focus-visible:outline-2 focus-visible:outline-indigo-600 ${selectedFolderId === folder.id ? 'bg-indigo-50 text-indigo-900' : 'text-slate-600 hover:bg-slate-50'}`}><Folder aria-hidden="true" className="size-4 shrink-0" /><span className="truncate">{folder.name}</span></button>)}
          </nav>

          <div className="min-h-0 overflow-y-auto" aria-live="polite">
            {visibleFiles.length ? <ul className="divide-y divide-slate-100">
              {visibleFiles.map((note) => {
                const folder = folders.find((item) => item.id === note.folderId)
                const isAvailable = Boolean(note.extractedText?.trim())
                return <li key={note.id} className="flex flex-col gap-3 py-4 first:pt-1 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-start gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-indigo-700"><FileText aria-hidden="true" className="size-5" /></span><div className="min-w-0"><p className="truncate font-semibold text-slate-900">{note.name}</p><p className="mt-1 text-xs text-slate-500">{(note.type === 'other' ? note.name.split('.').pop() ?? note.type : note.type).toUpperCase()} · {formatDate(note.uploadDate)}</p><p className="mt-1 truncate text-xs text-slate-500">{folder?.name ?? 'Unfiled'}</p>{!isAvailable && <p className="mt-1 text-xs text-amber-800">Re-upload in Notes to extract its text.</p>}</div></div>
                  <button type="button" disabled={!isAvailable || !folder} onClick={() => folder && onSelect(note, folder)} aria-label={`Select note ${note.name}`} className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-lg bg-indigo-700 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300">Select Note</button>
                </li>
              })}
            </ul> : <div className="flex min-h-48 flex-col items-center justify-center px-4 text-center"><span className="mb-3 flex size-11 items-center justify-center rounded-full bg-slate-100 text-slate-500"><FileText aria-hidden="true" className="size-5" /></span><p className="font-semibold text-slate-900">{query ? 'No notes found' : 'No saved notes here yet'}</p><p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">{query ? 'Try another search or choose a different folder.' : 'Upload a PDF, DOCX, PPTX, or text file in Notes first.'}</p></div>}
          </div>
        </div>

        <footer className="flex justify-end border-t border-slate-100 px-5 py-4 sm:px-6"><button type="button" onClick={onClose} aria-label="Cancel and close saved notes selector" className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-indigo-600">Cancel</button></footer>
      </section>
    </div>
  )
}
