import { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import { useDebouncedValue } from '../../hooks/useApi.js';
import { humanize } from '../../utils/format.js';

const MAX_SEARCH_LENGTH = 100;

/** Debounced search box plus select filters, shared by list pages. */
export default function ListFilters({ search, onSearch, placeholder, filters = [] }) {
	const [draft, setDraft] = useState(search);
	const debounced = useDebouncedValue(draft);

	useEffect(() => {
		const clean = debounced.trim().slice(0, MAX_SEARCH_LENGTH);
		if (clean !== search) onSearch(clean);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [debounced]);

	return (
		<div className="mb-4 flex flex-col gap-2.5 sm:flex-row" role="search">
			<label className="relative flex-1">
				<span className="sr-only">{placeholder}</span>
				<Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
				<input type="search" value={draft} maxLength={MAX_SEARCH_LENGTH} onChange={(e) => setDraft(e.target.value)} placeholder={placeholder} className="input pl-9" />
				{draft && (
					<button type="button" onClick={() => setDraft('')} className="absolute top-1/2 right-2 grid size-6 -translate-y-1/2 place-items-center rounded text-muted hover:text-ink" aria-label="Clear search">
						<X className="size-3.5" />
					</button>
				)}
			</label>
			{filters.map(({ key, label, value, options, onChange }) => (
				<label key={key} className="sm:w-48">
					<span className="sr-only">{label}</span>
					<select value={value} onChange={(e) => onChange(e.target.value)} className="input">
						<option value="">All {label.toLowerCase()}</option>
						{options.map((option) => (
							<option key={option} value={option}>
								{humanize(option)}
							</option>
						))}
					</select>
				</label>
			))}
		</div>
	);
}
