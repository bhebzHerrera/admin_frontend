import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPinOff, PowerOff } from 'lucide-react';
import { api } from '../../services/api.js';
import { useApi } from '../../hooks/useApi.js';
import { formatDateTime, humanize, timeAgo } from '../../utils/format.js';
import ErrorState, { EmptyState } from '../common/ErrorState.jsx';
import { ListSkeleton } from '../common/Skeleton.jsx';
import StatusBadge from '../common/StatusBadge.jsx';

const POLL_MS = (Number(import.meta.env.VITE_MONITORING_POLL_MS) || 15_000) * 2;

/** Geofence violations and remote engine-shutdown events, with active counts. */
export default function GeofenceStatus({ limit = 5 }) {
	const [tab, setTab] = useState('geofence');
	const violations = useApi((signal) => api.monitoring.geofenceViolations({ per_page: Math.max(5, limit) }, { signal }), [limit], { interval: POLL_MS });
	const shutdowns = useApi((signal) => api.monitoring.engineShutdowns({ per_page: Math.max(5, limit) }, { signal }), [limit], { interval: POLL_MS });

	const current = tab === 'geofence' ? violations : shutdowns;
	const items = (current.data?.data ?? []).slice(0, limit);

	const tabs = [
		{ key: 'geofence', label: 'Geofence', icon: MapPinOff, active: violations.data?.active_count },
		{ key: 'engine', label: 'Engine shutdowns', icon: PowerOff, active: shutdowns.data?.active_count },
	];

	return (
		<section className="card min-w-0 p-5" aria-label="Geofence and engine status">
			<header>
				<h2 className="text-base font-extrabold tracking-tight">Geofence & engine status</h2>
				<p className="mt-1 text-xs text-muted">Service-area breaches and remote immobilisation events</p>
			</header>

			<div className="mt-4 grid grid-cols-2 gap-2" role="tablist">
				{tabs.map(({ key, label, icon: Icon, active }) => (
					<button
						key={key}
						type="button"
						role="tab"
						aria-selected={tab === key}
						onClick={() => setTab(key)}
						className={`rounded-md border p-3 text-left transition-colors ${tab === key ? 'border-accent bg-soft' : 'border-divider hover:bg-surface-2'}`}
					>
						<span className="flex items-center gap-1.5 text-[11px] font-bold text-muted">
							<Icon className="size-3.5" aria-hidden="true" /> {label}
						</span>
						<strong className={`mt-1 block text-2xl font-black tracking-tight ${active ? 'text-danger' : ''}`}>{active ?? '–'}</strong>
						<span className="text-[10px] text-muted">active now</span>
					</button>
				))}
			</div>

			<div role="tabpanel" className="mt-3">
				{current.loading && !current.data ? (
					<ListSkeleton rows={Math.min(limit, 4)} />
				) : current.error && !current.data ? (
					<ErrorState error={current.error} onRetry={current.reload} compact />
				) : items.length === 0 ? (
					<EmptyState title="No events" message="Nothing has been recorded yet." />
				) : (
					<ul className="divide-y divide-divider">
						{items.map((item) => (tab === 'geofence' ? <ViolationRow key={item.id} item={item} /> : <ShutdownRow key={item.id} item={item} />))}
					</ul>
				)}
			</div>
		</section>
	);
}

function VehicleLine({ item }) {
	return (
		<p className="mt-1 truncate text-xs text-muted">
			<Link to={`/vehicles/${item.vehicle?.id}`} className="font-bold text-ink hover:underline">
				{item.vehicle?.plate_number}
			</Link>{' '}
			· {item.vehicle?.name}
			{item.rental?.customer && ` · ${item.rental.customer.full_name}`}
		</p>
	);
}

function ViolationRow({ item }) {
	return (
		<li className="py-3">
			<div className="flex items-center justify-between gap-2">
				<strong className="truncate text-[13px]">
					{humanize(item.violation_type)} · {item.zone_name}
				</strong>
				<StatusBadge tone={item.is_active ? 'danger' : 'success'} label={item.is_active ? 'Active' : 'Resolved'} />
			</div>
			<VehicleLine item={item} />
			<p className="mt-0.5 text-[11px] text-muted" title={formatDateTime(item.occurred_at)}>
				{item.distance_outside_km.toFixed(1)} km outside · {timeAgo(item.occurred_at)}
			</p>
		</li>
	);
}

function ShutdownRow({ item }) {
	return (
		<li className="py-3">
			<div className="flex items-center justify-between gap-2">
				<strong className="truncate text-[13px]">{humanize(item.reason)}</strong>
				<StatusBadge tone={item.is_active ? 'danger' : 'success'} label={item.is_active ? 'Immobilised' : 'Restored'} />
			</div>
			<VehicleLine item={item} />
			<p className="mt-0.5 text-[11px] text-muted" title={formatDateTime(item.occurred_at)}>
				Triggered by {item.triggered_by} · {timeAgo(item.occurred_at)}
				{item.restored_at && ` · restored ${timeAgo(item.restored_at)}`}
			</p>
		</li>
	);
}
