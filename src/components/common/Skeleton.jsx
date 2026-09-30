/** Loading placeholders shown while data is fetched. */
export function Skeleton({ className = '', style }) {
	return <div aria-hidden="true" style={style} className={`animate-pulse rounded-md bg-divider ${className}`} />;
}

export function CardSkeleton({ lines = 2 }) {
	return (
		<div className="card space-y-3 p-5" aria-hidden="true">
			<Skeleton className="h-3 w-24" />
			<Skeleton className="h-8 w-20" />
			{Array.from({ length: lines - 1 }, (_, i) => (
				<Skeleton key={i} className="h-3 w-32" />
			))}
		</div>
	);
}

export function ChartSkeleton({ height = 260 }) {
	return (
		<div className="flex items-end gap-2 px-2" style={{ height }} aria-hidden="true">
			{[45, 70, 55, 85, 60, 95, 75, 65, 80, 50, 90, 70].map((h, i) => (
				<Skeleton key={i} className="flex-1 rounded-b-none" style={{ height: `${h}%` }} />
			))}
		</div>
	);
}

export function TableSkeleton({ rows = 6, columns = 5 }) {
	return (
		<div className="space-y-0" role="status" aria-label="Loading records">
			{Array.from({ length: rows }, (_, r) => (
				<div key={r} className="flex gap-4 border-b border-divider px-3 py-4">
					{Array.from({ length: columns }, (_, c) => (
						<Skeleton key={c} className={`h-3 ${c === 0 ? 'w-1/4' : 'flex-1'}`} />
					))}
				</div>
			))}
		</div>
	);
}

export function ListSkeleton({ rows = 4 }) {
	return (
		<div className="divide-y divide-divider" role="status" aria-label="Loading">
			{Array.from({ length: rows }, (_, i) => (
				<div key={i} className="flex items-center gap-3 py-3.5">
					<Skeleton className="size-8 shrink-0" />
					<div className="flex-1 space-y-2">
						<Skeleton className="h-3 w-2/3" />
						<Skeleton className="h-2.5 w-1/3" />
					</div>
				</div>
			))}
		</div>
	);
}
