import { useMemo, useRef, useState, type FormEvent } from 'react'
import { ArrowLeft, FileText, Folder, FolderOpen, FolderPlus, LoaderCircle, Search, Trash2, Upload, X } from 'lucide-react'
import DeleteFolderModal from '../components/DeleteFolderModal'
import type { Folder as NoteFolder, NoteFile, NoteFileType } from '../types'
import { getNoteFiles, getNoteFolders, NotesStorageQuotaError, saveNoteFiles, saveNoteFolders } from '../services/notesStorage'
import { DocumentExtractionError, extractDocumentText, MAX_DOCUMENT_BYTES, type ExtractionProgress } from '../services/documentExtraction'

const supportedTypes = new Set<NoteFileType>(['pdf', 'docx', 'pptx', 'txt'])
const fieldClass = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100'

function getFileType(fileName: string): NoteFileType {
  const extension = fileName.split('.').pop()?.toLowerCase() ?? ''
  return supportedTypes.has(extension as NoteFileType) ? extension as NoteFileType : 'other'
}

function formatSize(size: number): string {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value))
}

function formatCount(count: number, singular: string): string {
  return `${count} ${singular}${count === 1 ? '' : 's'}`
}

export default function Notes() {
  const [folders, setFolders] = useState<NoteFolder[]>(getNoteFolders)
  const [files, setFiles] = useState<NoteFile[]>(getNoteFiles)
  const [search, setSearch] = useState('')
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const [isCreatingFolder, setIsCreatingFolder] = useState(false)
  const [folderToDelete, setFolderToDelete] = useState<NoteFolder | null>(null)
  const [folderName, setFolderName] = useState('')
  const [folderError, setFolderError] = useState('')
  const [uploadError, setUploadError] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<ExtractionProgress | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const query = search.trim().toLocaleLowerCase()
  const selectedFolder = folders.find((folder) => folder.id === selectedFolderId)

  const visibleFolders = useMemo(() => folders.filter((folder) => (
    !query || folder.name.toLocaleLowerCase().includes(query) || files.some((file) => (
      file.folderId === folder.id && file.name.toLocaleLowerCase().includes(query)
    ))
  )), [folders, files, query])
  const visibleFiles = useMemo(() => files.filter((file) => (
    file.folderId === selectedFolderId && (!query || file.name.toLocaleLowerCase().includes(query))
  )), [files, query, selectedFolderId])

  function createFolder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const name = folderName.trim()
    if (!name) {
      setFolderError('Enter a name for this folder.')
      return
    }
    if (folders.some((folder) => folder.name.toLocaleLowerCase() === name.toLocaleLowerCase())) {
      setFolderError('A folder with this name already exists.')
      return
    }

    const nextFolders = [{ id: crypto.randomUUID(), name, createdAt: new Date().toISOString() }, ...folders]
    setFolders(nextFolders)
    saveNoteFolders(nextFolders)
    setFolderName('')
    setFolderError('')
    setIsCreatingFolder(false)
  }

  async function addFiles(fileList: FileList | null) {
    if (!selectedFolder || !fileList?.length) return
    const incoming = Array.from(fileList)
    const invalidFiles = incoming.filter((file) => !supportedTypes.has(getFileType(file.name)))
    if (invalidFiles.length) {
      setUploadError(`Unsupported file type: ${invalidFiles.map((file) => file.name).join(', ')}. Choose PDF, DOCX, PPTX, or TXT.`)
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    setIsUploading(true)
    setUploadError('')
    const newFiles: NoteFile[] = []
    const failures: string[] = []
    for (const [index, file] of incoming.entries()) {
      try {
        if (file.size > MAX_DOCUMENT_BYTES) throw new DocumentExtractionError('File is larger than 50 MB.')
        setUploadProgress({ stage: `Reading ${file.name} (${index + 1} of ${incoming.length})…`, percent: Math.round((index / incoming.length) * 100) })
        const extractedText = await extractDocumentText(file, (progress) => setUploadProgress({
          stage: `${file.name}: ${progress.stage}`,
          percent: Math.min(99, Math.round(((index + progress.percent / 100) / incoming.length) * 100)),
        }))
        newFiles.push({
          id: crypto.randomUUID(),
          folderId: selectedFolder.id,
          name: file.name,
          type: getFileType(file.name),
          size: file.size,
          uploadDate: new Date().toISOString(),
          extractedText,
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Could not extract text.'
        failures.push(`${file.name}: ${message}`)
      }
    }

    try {
      const nextFiles = [...newFiles, ...files]
      saveNoteFiles(nextFiles)
      setFiles(nextFiles)
      setUploadError(failures.join(' '))
    } catch (error) {
      setUploadError(error instanceof NotesStorageQuotaError
        ? error.message
        : 'The extracted notes could not be saved in this browser. Remove some saved notes and try again.')
    } finally {
      setIsUploading(false)
      setUploadProgress(null)
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function removeFile(fileId: string) {
    const nextFiles = files.filter((file) => file.id !== fileId)
    setFiles(nextFiles)
    saveNoteFiles(nextFiles)
  }

  function deleteFolder(folderId: string) {
    const nextFolders = folders.filter((folder) => folder.id !== folderId)
    const nextFiles = files.filter((file) => file.folderId !== folderId)
    try {
      saveNoteFiles(nextFiles)
      saveNoteFolders(nextFolders)
      setFiles(nextFiles)
      setFolders(nextFolders)
      setSelectedFolderId((currentId) => currentId === folderId ? null : currentId)
      setFolderToDelete(null)
      setUploadError('')
    } catch {
      setUploadError('The folder could not be deleted from browser storage. Free some storage space and try again.')
      setFolderToDelete(null)
    }
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-7 sm:px-7 lg:px-10 lg:py-10">
      <header className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-sm font-bold uppercase tracking-[0.12em] text-indigo-700">Your learning space</p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Notes</h1>
          <p className="mt-2 max-w-2xl text-base leading-7 text-slate-600">Keep course materials organized in folders on this device.</p>
        </div>
        {!selectedFolder && <button type="button" onClick={() => { setFolderError(''); setIsCreatingFolder(true) }} aria-label="Create new folder" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-indigo-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-700"><FolderPlus aria-hidden="true" className="size-4" />Create new folder</button>}
      </header>

      <section className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5" aria-label="Search notes">
        <label htmlFor="notes-search" className="mb-2 block text-sm font-semibold text-slate-800">Search folders and files</label>
        <div className="relative">
          <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input id="notes-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by folder or file name" aria-label="Search folders and files by name" className={`${fieldClass} pl-10 pr-10`} />
          {search && <button type="button" onClick={() => setSearch('')} aria-label="Clear search" className="absolute right-2 top-1/2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-indigo-600"><X aria-hidden="true" className="size-4" /></button>}
        </div>
      </section>

      {selectedFolder ? (
        <section aria-labelledby="folder-heading">
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <button type="button" onClick={() => { setSelectedFolderId(null); setUploadError('') }} className="mb-3 inline-flex min-h-9 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-indigo-800 hover:bg-indigo-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"><ArrowLeft aria-hidden="true" className="size-4" />All notes</button>
              <div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700"><FolderOpen aria-hidden="true" className="size-5" /></span><div><h2 id="folder-heading" className="text-xl font-bold text-slate-950">{selectedFolder.name}</h2><p className="text-sm text-slate-500">{formatCount(files.filter((file) => file.folderId === selectedFolder.id).length, 'file')}</p></div></div>
            </div>
            <input ref={fileInputRef} type="file" multiple accept=".pdf,.docx,.pptx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain" onChange={(event) => void addFiles(event.target.files)} className="hidden" aria-label="Choose PDF, DOCX, PPTX, or text files" />
            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isUploading} aria-label={`Upload files to ${selectedFolder.name}`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-indigo-200 bg-white px-4 py-2.5 text-sm font-bold text-indigo-800 transition hover:bg-indigo-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-wait disabled:opacity-60"><Upload aria-hidden="true" className="size-4" />Upload files</button>
          </div>

          {isUploading && <div className="mb-4 rounded-lg border border-indigo-100 bg-indigo-50 p-3" role="status" aria-live="polite"><div className="flex items-center gap-2 text-sm font-semibold text-indigo-900"><LoaderCircle aria-hidden="true" className="size-4 animate-spin" />{uploadProgress?.stage ?? 'Extracting note text…'}</div><progress className="mt-2 h-2 w-full accent-indigo-700" max="100" value={uploadProgress?.percent ?? 0} aria-label="Notes extraction progress" /></div>}
          {uploadError && <p role="alert" className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-900">{uploadError}</p>}
          {visibleFiles.length ? <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white px-4 shadow-sm sm:px-6">
            {visibleFiles.map((file) => <li key={file.id} className="flex items-center gap-3 py-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-indigo-700"><FileText aria-hidden="true" className="size-5" /></span>
              <div className="min-w-0 flex-1"><p className="truncate font-semibold text-slate-900">{file.name}</p><p className="mt-1 text-xs text-slate-500">{file.type.toUpperCase()} · {formatSize(file.size)} · Added {formatDate(file.uploadDate)}</p></div>
              <button type="button" onClick={() => removeFile(file.id)} aria-label={`Remove ${file.name}`} className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-rose-50 hover:text-rose-700 focus-visible:outline-2 focus-visible:outline-indigo-600"><Trash2 aria-hidden="true" className="size-4" /></button>
            </li>)}
          </ul> : <div className="flex flex-col items-center rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
            <span className="mb-3 flex size-11 items-center justify-center rounded-full bg-indigo-50 text-indigo-700"><Upload aria-hidden="true" className="size-5" /></span>
            <p className="font-semibold text-slate-900">{query ? 'No matching files' : 'This folder is ready for notes'}</p>
            <p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">{query ? 'Try another search, or clear it to see all files in this folder.' : 'Add PDF, Word, PowerPoint, or text files. File details are saved locally in this browser.'}</p>
            {!query && <button type="button" onClick={() => fileInputRef.current?.click()} aria-label="Upload the first file to this folder" className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg bg-indigo-700 px-3 py-2 text-sm font-bold text-white hover:bg-indigo-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-700"><Upload aria-hidden="true" className="size-4" />Upload files</button>}
          </div>}
        </section>
      ) : (
        <section aria-labelledby="folders-heading">
          <div className="mb-4 flex items-center justify-between gap-3"><div><h2 id="folders-heading" className="text-lg font-bold text-slate-950">Your folders</h2><p className="mt-1 text-sm text-slate-500">{formatCount(folders.length, 'folder')}</p></div></div>
          {visibleFolders.length ? <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {visibleFolders.map((folder) => {
              const folderFiles = files.filter((file) => file.folderId === folder.id)
              const matchingFiles = query ? folderFiles.filter((file) => file.name.toLocaleLowerCase().includes(query)) : folderFiles
              const folderNameMatches = !query || folder.name.toLocaleLowerCase().includes(query)
              return <li key={folder.id} className="relative rounded-xl border border-slate-200 bg-white shadow-sm transition hover:border-indigo-200 hover:shadow-md">
                <button type="button" onClick={() => { setSelectedFolderId(folder.id); setUploadError('') }} aria-label={`Open folder ${folder.name}`} className="flex min-h-36 w-full items-start gap-4 rounded-xl p-5 pr-14 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700"><Folder aria-hidden="true" className="size-5" /></span>
                  <span className="min-w-0 flex-1"><span className="block truncate font-bold text-slate-950">{folder.name}</span><span className="mt-1 block text-sm text-slate-500">{query && !folderNameMatches ? `${formatCount(matchingFiles.length, 'matching file')}` : formatCount(folderFiles.length, 'file')}</span><span className="mt-4 block text-xs text-slate-400">Created {formatDate(folder.createdAt)}</span></span>
                </button>
                <button type="button" onClick={() => setFolderToDelete(folder)} aria-label="Delete folder" title={`Delete ${folder.name}`} className="absolute right-3 top-3 inline-flex size-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-700"><Trash2 aria-hidden="true" className="size-4" /></button>
              </li>
            })}
          </ul> : <div className="flex flex-col items-center rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
            <span className="mb-3 flex size-11 items-center justify-center rounded-full bg-slate-100 text-slate-600"><Folder aria-hidden="true" className="size-5" /></span>
            <p className="font-semibold text-slate-900">{query ? 'No folders or files found' : 'No folders yet'}</p>
            <p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">{query ? 'Try a different name or clear your search.' : 'Create a folder for a course, unit, or subject to get started.'}</p>
            {!query && <button type="button" onClick={() => setIsCreatingFolder(true)} className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg border border-indigo-200 px-3 py-2 text-sm font-bold text-indigo-800 hover:bg-indigo-50 focus-visible:outline-2 focus-visible:outline-indigo-600"><FolderPlus aria-hidden="true" className="size-4" />Create new folder</button>}
          </div>}
        </section>
      )}

      {isCreatingFolder && <div className="fixed inset-x-0 top-0 bottom-0 z-40 flex items-start justify-center overflow-y-auto bg-slate-950/40 p-4 sm:items-center" onKeyDown={(event) => { if (event.key === 'Escape') setIsCreatingFolder(false) }}>
        <section role="dialog" aria-modal="true" aria-labelledby="create-folder-heading" className="w-full rounded-xl border border-slate-200 bg-white p-5 shadow-xl sm:p-6" style={{ maxWidth: '28rem' }}>
          <div className="mb-5 flex items-start justify-between gap-4"><div><h2 id="create-folder-heading" className="text-lg font-bold text-slate-950">Create a folder</h2><p className="mt-1 text-sm text-slate-500">Give this set of class materials a name.</p></div><button type="button" onClick={() => setIsCreatingFolder(false)} aria-label="Close create folder dialog" className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-indigo-600"><X aria-hidden="true" className="size-4" /></button></div>
          <form onSubmit={createFolder}>
            <label htmlFor="new-folder-name" className="mb-2 block text-sm font-semibold text-slate-800">Folder name</label>
            <input id="new-folder-name" type="text" value={folderName} onChange={(event) => { setFolderName(event.target.value); setFolderError('') }} maxLength={60} autoFocus placeholder="For example, Unit 1" aria-label="New folder name" aria-describedby={folderError ? 'folder-name-error' : undefined} className={fieldClass} />
            {folderError && <p id="folder-name-error" role="alert" className="mt-2 text-sm text-rose-700">{folderError}</p>}
            <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setIsCreatingFolder(false)} className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-indigo-600">Cancel</button><button type="submit" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-indigo-700 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-800 focus-visible:outline-2 focus-visible:outline-indigo-700"><FolderPlus aria-hidden="true" className="size-4" />Create folder</button></div>
          </form>
        </section>
      </div>}
      {folderToDelete && <DeleteFolderModal folderName={folderToDelete.name} onCancel={() => setFolderToDelete(null)} onConfirm={() => deleteFolder(folderToDelete.id)} />}
    </main>
  )
}
