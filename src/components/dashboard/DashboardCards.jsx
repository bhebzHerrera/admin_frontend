import { AlertTriangle, CalendarClock, Car, CircleCheck, Users } from 'lucide-react';
import { formatCurrency, formatNumber } from '../../utils/format.js';
import ErrorState from '../common/ErrorState.jsx';
import { CardSkeleton } from '../common/Skeleton.jsx';

/** Headline KPI cards: vehicles, active rentals, availability, customers, collisions. */
export default function DashboardCards({ stats, loading, error, onRetry }) {
	if (loading && !stats) {
		return (
			<div className="grid grid-cols-2 gap-3.5 md:grid-cols-3 xl:grid-cols-5">
				{Array.from({ length: 5 }, (_, i) => (
					<CardSkeleton key={i} />
				))}
			</div>
		);
	}

	if (error && !stats) {
		return (
			<div className="card">
				<ErrorState error={error} onRetry={onRetry} compact />
			</div>
		);
	}

	const cards = [
		{ label: 'Total vehicles', value: stats.total_vehicles, note: 'Registered fleet', icon: Car },
		{ label: 'Active rentals', value: stats.active_rentals, note: `${stats.returns_due_today} due back today`, icon: CalendarClock },
		{ label: 'Available vehicles', value: stats.available_vehicles, note: `${Math.round((stats.available_vehicles / Math.max(1, stats.total_vehicles)) * 100)}% of fleet ready`, icon: CircleCheck },
		{ label: 'Total customers', value: stats.total_customers, note: `${formatCurrency(stats.revenue_this_month)} collected this month`, icon: Users },
		{ label: 'Reported collisions', value: stats.reported_collisions, note: `${stats.open_collisions} awaiting review`, icon: AlertTriangle, alert: stats.open_collisions > 0 },
	];

	return (
		<div className="grid grid-cols-2 gap-3.5 md:grid-cols-3 xl:grid-cols-5">
			{cards.map(({ label, value, note, icon: Icon, alert }, i) => (
				<article key={label} className={`card p-5 ${i === 4 ? 'col-span-2 md:col-span-1' : ''}`}>
					<div className="flex items-center justify-between gap-2">
						<span className="text-[13px] text-muted">{label}</span>
						<span className={`grid size-8 place-items-center rounded-md ${alert ? 'bg-danger-soft text-danger' : 'bg-soft text-accent-strong'}`}>
							<Icon className="size-4" aria-hidden="true" />
						</span>
					</div>
					<strong className="mt-3 mb-1.5 block text-[32px] leading-none font-black tracking-[-0.06em]">{formatNumber(value)}</strong>
					<small className={`text-[11px] ${alert ? 'font-bold text-danger' : 'text-muted'}`}>{note}</small>
				</article>
			))}
		</div>
	);
}
