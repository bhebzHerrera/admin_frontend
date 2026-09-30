import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatNumber } from '../../utils/format.js';

/** Pager driven by Laravel's paginator `meta` block. */
export default function Pagination({ meta, onPageChange, disabled }) {
	if (!meta || meta.last_page <= 1) return null;
	const { current_page: page, last_page: last, from, to, total } = meta;

	return (
		<nav className="flex flex-wrap items-center justify-between gap-3 px-1 pt-4 text-xs text-muted" aria-label="Pagination">
			<span>
				Showing <b className="text-ink">{formatNumber(from)}–{formatNumber(to)}</b> of <b className="text-ink">{formatNumber(total)}</b>
			</span>
			<div className="flex items-center gap-2">
				<button type="button" className="btn btn-secondary px-3 py-2" onClick={() => onPageChange(page - 1)} disabled={disabled || page <= 1} aria-label="Previous page">
					<ChevronLeft className="size-4" aria-hidden="true" />
				</button>
				<span className="font-mono">
					{page} / {last}
				</span>
				<button type="button" className="btn btn-secondary px-3 py-2" onClick={() => onPageChange(page + 1)} disabled={disabled || page >= last} aria-label="Next page">
					<ChevronRight className="size-4" aria-hidden="true" />
				</button>
			</div>
		</nav>
	);
}
