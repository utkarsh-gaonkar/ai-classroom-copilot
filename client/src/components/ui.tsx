import { AlertCircle, LoaderCircle, X } from 'lucide-react'

export function ErrorMessage({ message, onDismiss }: { message: string; onDismiss?: () => void }) {
	return (
		<div role="alert" className="flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 p-4 text-rose-950">
			<AlertCircle aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-rose-700" />
			<p className="flex-1 text-sm leading-6">{message}</p>
			{onDismiss && <button type="button" onClick={onDismiss} aria-label="Dismiss error" className="rounded p-1 text-rose-700 hover:bg-rose-100"><X aria-hidden="true" className="size-4" /></button>}
		</div>
	)
}

export function LoadingSpinner({ label = 'Working…' }: { label?: string }) {
	return <span className="inline-flex items-center gap-2"><LoaderCircle aria-hidden="true" className="size-5 animate-spin" />{label}</span>
}
