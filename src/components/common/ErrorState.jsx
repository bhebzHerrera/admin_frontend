import { RotateCcw, WifiOff } from 'lucide-react';

/** Inline error message for a failed request, with a retry action. */
export default function ErrorState({ error, onRetry, compact = false }) {
	return (
		<div role="alert" className={`flex flex-col items-center justify-center text-center ${compact ? 'py-6' : 'py-12'}`}>
			<span className="grid size-10 place-items-center rounded-md bg-danger-soft text-danger">
				<WifiOff className="size-5" aria-hidden="true" />
			</span>
			<p className="mt-3 text-sm font-bold">Couldn't load this data</p>
			<p className="mt-1 max-w-xs text-xs text-muted">{error?.message ?? 'An unexpected error occurred.'}</p>
			{onRetry && (
				<button type="button" onClick={onRetry} className="btn btn-secondary mt-4 py-2">
					<RotateCcw className="size-3.5" aria-hidden="true" /> Retry
				</button>
			)}
		</div>
	);
}

export function EmptyState({ title = 'Nothing to show', message }) {
	return (
		<div className="py-10 text-center">
			<p className="text-sm font-bold">{title}</p>
			{message && <p className="mt-1 text-xs text-muted">{message}</p>}
		</div>
	);
}
