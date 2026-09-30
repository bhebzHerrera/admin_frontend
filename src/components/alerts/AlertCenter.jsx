import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertTriangle, Bell, CalendarClock, CreditCard, ListChecks, MapPinOff, PowerOff } from 'lucide-react';
import { api } from '../../services/api.js';
import { useApi } from '../../hooks/useApi.js';
import { timeAgo } from '../../utils/format.js';
import { PageHeader } from '../common/AppLayout.jsx';
import ErrorState, { EmptyState } from '../common/ErrorState.jsx';
import Pagination from '../common/Pagination.jsx';
import { ListSkeleton } from '../common/Skeleton.jsx';

const POLL_MS = (Number(import.meta.env.VITE_MONITORING_POLL_MS) || 15_000) * 2;

const ICONS = {
	collision: AlertTriangle,
	geofence: MapPinOff,
	engine_shutdown: PowerOff,
	payment_verification: CreditCard,
	rental_extension: CalendarClock,
	booking: ListChecks,
};

const TONE_CLASS = {
	danger: 'bg-danger-soft text-danger',
	warning: 'bg-warning-soft text-warning',
	info: 'bg-info-soft text-info',
};

const TYPE_LABEL = {
	collision: 'Collisions',
	geofence: 'Geofence',
	engine_shutdown: 'Engine',
	payment_verification: 'Payments',
	rental_extension: 'Extensions',
	booking: 'Bookings',
};

/** A single unified feed of everything across the app that needs staff attention. */
export default function AlertCenter() {
	const [params, setParams] = useSearchParams();
	const [type, setType] = useState('');
	const page = Number(params.get('page')) || 1;

	const { data, loading, error, reload, updatedAt } = useApi((signal) => api.alerts.list({ page, per_page: 15 }, { signal }), [page], { interval: POLL_MS });
	const items = (data?.data ?? []).filter((item) => !type || item.type === type);
	const counts = data?.counts ?? {};

	const update = (changes) =>
		setParams((prev) => {
			const next = new URLSearchParams(prev);
			Object.entries(changes).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
			return next;
		});

	return (
		<>
			<PageHeader eyebrow="IoT & Alerts" title="Alert Center" description={`${counts.total ?? 0} item${counts.total === 1 ? '' : 's'} across the fleet need attention.`} />

			<div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
				{Object.entries(TYPE_LABEL).map(([key, label]) => {
					const Icon = ICONS[key];
					return (
						<button
							key={key}
							type="button"
							onClick={() => setType(type === key ? '' : key)}
							className={`rounded-md border p-3 text-left transition-colors ${type === key ? 'border-accent bg-soft' : 'border-divider hover:bg-surface-2'}`}
						>
							<span className="flex items-center gap-1.5 text-[11px] font-bold text-muted">
								<Icon className="size-3.5" aria-hidden="true" /> {label}
							</span>
							<strong className="mt-1 block text-xl font-black tracking-tight">{counts[key === 'engine_shutdown' ? 'engine_shutdowns' : `${key}s`] ?? counts[key] ?? 0}</strong>
						</button>
					);
				})}
			</div>

			<section className="card p-2 sm:p-4" aria-busy={loading}>
				<header className="mb-2 flex items-center justify-between px-2 pt-1">
					<h2 className="text-sm font-extrabold">All alerts</h2>
					<span className="font-mono text-[10px] text-muted">{updatedAt ? `Updated ${timeAgo(updatedAt.toISOString())}` : ''}</span>
				</header>

				{loading && !data ? (
					<ListSkeleton rows={8} />
				) : error && !data ? (
					<ErrorState error={error} onRetry={reload} />
				) : items.length === 0 ? (
					<EmptyState title="All clear" message="Nothing needs attention right now." />
				) : (
					<ul className={`divide-y divide-divider ${loading ? 'opacity-60 transition-opacity' : ''}`}>
						{items.map((item) => {
							const Icon = ICONS[item.type] ?? Bell;
							return (
								<li key={item.id}>
									<Link to={item.link} className="flex items-start gap-3 px-2 py-3.5 hover:bg-surface-2">
										<span className={`grid size-8 shrink-0 place-items-center rounded-md ${TONE_CLASS[item.tone] ?? TONE_CLASS.info}`}>
											<Icon className="size-4" aria-hidden="true" />
										</span>
										<div className="min-w-0 flex-1">
											<p className="text-[13px] font-bold">{item.title}</p>
											<p className="truncate text-xs text-muted">{item.message}</p>
										</div>
										<span className="shrink-0 text-[11px] text-muted">{timeAgo(item.occurred_at)}</span>
									</Link>
								</li>
							);
						})}
					</ul>
				)}
				<Pagination meta={data?.meta} onPageChange={(p) => update({ page: String(p) })} disabled={loading} />
			</section>
		</>
	);
}
