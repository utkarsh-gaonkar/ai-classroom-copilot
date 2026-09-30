import { useEffect, useRef } from 'react'
import { Trash2, X } from 'lucide-react'

interface DeleteFolderModalProps {
  folderName: string
  onCancel: () => void
  onConfirm: () => void
}

export default function DeleteFolderModal({ folderName, onCancel, onConfirm }: DeleteFolderModalProps) {
  const dialogRef = useRef<HTMLElement>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    cancelRef.current?.focus()
    return () => {
      previousFocus?.focus()
    }
  }, [])

  function handleDialogKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.preventDefault()
      onCancel()
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

  return (
    <div className="fixed inset-x-0 top-0 bottom-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/45 p-4 sm:items-center" onKeyDown={handleDialogKeyDown}>
      <section ref={dialogRef} role="alertdialog" aria-modal="true" aria-labelledby="delete-folder-heading" aria-describedby="delete-folder-description" className="my-auto w-full rounded-xl border border-slate-200 bg-white p-5 shadow-xl sm:p-6" style={{ maxWidth: '28rem' }}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-700"><Trash2 aria-hidden="true" className="size-5" /></span>
            <div><h2 id="delete-folder-heading" className="text-lg font-bold text-slate-950">Delete folder?</h2><p id="delete-folder-description" className="mt-2 text-sm leading-6 text-slate-600">Are you sure you want to delete the folder '{folderName}'? This will also permanently delete all notes inside it.</p></div>
          </div>
          <button type="button" onClick={onCancel} aria-label="Close delete folder confirmation" className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-indigo-600"><X aria-hidden="true" className="size-4" /></button>
        </div>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button ref={cancelRef} type="button" onClick={onCancel} className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-indigo-600">Cancel</button>
          <button type="button" onClick={onConfirm} aria-label={`Delete folder ${folderName} and its notes`} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-rose-700 px-4 py-2 text-sm font-bold text-white hover:bg-rose-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-700"><Trash2 aria-hidden="true" className="size-4" />Delete Folder</button>
        </div>
      </section>
    </div>
  )
}
