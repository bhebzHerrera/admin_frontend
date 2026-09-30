import { useState } from 'react';
import { BarChart3, Table2 } from 'lucide-react';
import ErrorState from './ErrorState.jsx';
import { ChartSkeleton } from './Skeleton.jsx';

/**
 * Card wrapper for every chart: title, loading skeleton, error + retry,
 * and an accessible table view of the same data.
 */
export default function ChartCard({ title, subtitle, loading, error, onRetry, table, actions, height = 260, children }) {
	const [showTable, setShowTable] = useState(false);

	return (
		<section className="card flex min-w-0 flex-col p-5" aria-label={title}>
			<header className="flex flex-wrap items-start justify-between gap-3">
				<div>
					<h2 className="text-base font-extrabold tracking-tight">{title}</h2>
					{subtitle && <p className="mt-1 text-xs text-muted">{subtitle}</p>}
				</div>
				<div className="flex items-center gap-2">
					{actions}
					{table && !loading && !error && (
						<button
							type="button"
							onClick={() => setShowTable((v) => !v)}
							className="grid size-8 place-items-center rounded-md border border-divider text-muted hover:bg-soft hover:text-accent-strong"
							aria-pressed={showTable}
							title={showTable ? 'Show chart' : 'Show data table'}
						>
							{showTable ? <BarChart3 className="size-4" aria-hidden="true" /> : <Table2 className="size-4" aria-hidden="true" />}
							<span className="sr-only">{showTable ? 'Show chart' : 'Show data table'}</span>
						</button>
					)}
				</div>
			</header>

			<div className="mt-5 min-h-0 flex-1">
				{loading ? (
					<ChartSkeleton height={height} />
				) : error ? (
					<ErrorState error={error} onRetry={onRetry} compact />
				) : showTable && table ? (
					<DataTable {...table} />
				) : (
					children
				)}
			</div>
		</section>
	);
}

function DataTable({ columns, rows }) {
	return (
		<div className="max-h-80 overflow-auto">
			<table className="w-full text-left">
				<thead className="sticky top-0 bg-surface">
					<tr>
						{columns.map((col) => (
							<th key={col.key} scope="col" className={`th ${col.align === 'right' ? 'text-right' : ''}`}>
								{col.label}
							</th>
						))}
					</tr>
				</thead>
				<tbody>
					{rows.map((row, i) => (
						<tr key={i}>
							{columns.map((col) => (
								<td key={col.key} className={`td tabular-nums ${col.align === 'right' ? 'text-right' : ''}`}>
									{col.format ? col.format(row[col.key], row) : row[col.key]}
								</td>
							))}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
