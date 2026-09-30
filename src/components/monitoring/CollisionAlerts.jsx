import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertOctagon, AlertTriangle, CheckCircle2, CircleAlert, Info } from 'lucide-react';
import { api } from '../../services/api.js';
import { useApi } from '../../hooks/useApi.js';
import { formatDateTime, humanize, timeAgo } from '../../utils/format.js';
import ErrorState, { EmptyState } from '../common/ErrorState.jsx';
import { ListSkeleton } from '../common/Skeleton.jsx';
import StatusBadge from '../common/StatusBadge.jsx';
import { LiveIndicator } from './VehicleLocation.jsx';

const POLL_MS = Number(import.meta.env.VITE_MONITORING_POLL_MS) || 15_000;
const ICONS = { minor: Info, moderate: CircleAlert, severe: AlertTriangle, critical: AlertOctagon };
const ICON_TONE = { minor: 'bg-warning-soft text-warning', moderate: 'bg-warning-soft text-warning', severe: 'bg-danger-soft text-danger', critical: 'bg-danger text-surface' };

/** Unresolved collision alerts with acknowledge / resolve actions. */
export default function CollisionAlerts({ limit = 5, showViewAll = false }) {
	const { data, loading, error, reload, updatedAt } = useApi((signal) => api.collisions.list({ status: 'open', per_page: Math.max(5, limit) }, { signal }), [limit], {
		interval: POLL_MS,
	});
	const [busyId, setBusyId] = useState(null);
	const [actionError, setActionError] = useState('');

	const alerts = (data?.data ?? []).slice(0, limit);
	const total = data?.meta?.total ?? 0;

	const updateStatus = async (id, status) => {
		setBusyId(id);
		setActionError('');
		try {
			await api.collisions.update(id, status);
			reload();
		} catch (err) {
			setActionError(err.message);
		} finally {
			setBusyId(null);
		}
	};

	return (
		<section className="card min-w-0 p-5" aria-label="Collision alerts">
			<header className="mb-2 flex flex-wrap items-start justify-between gap-3">
				<div>
					<h2 className="text-base font-extrabold tracking-tight">Collision alerts</h2>
					<p className="mt-1 text-xs text-muted">{data ? `${total} unresolved impact${total === 1 ? '' : 's'} detected by IMU sensors` : 'Impacts reported by onboard sensors'}</p>
				</div>
				{showViewAll ? (
					<Link to="/monitoring" className="text-xs font-extrabold text-accent-strong hover:underline">
						View all →
					</Link>
				) : (
					<LiveIndicator updatedAt={updatedAt} error={error && data ? error : null} />
				)}
			</header>

			{actionError && (
				<p role="alert" className="mb-2 rounded bg-danger-soft px-3 py-2 text-xs font-semibold text-danger">
					{actionError}
				</p>
			)}

			{loading && !data ? (
				<ListSkeleton rows={Math.min(limit, 4)} />
			) : error && !data ? (
				<ErrorState error={error} onRetry={reload} compact />
			) : alerts.length === 0 ? (
				<EmptyState title="All clear" message="No unresolved collision alerts." />
			) : (
				<ul className="divide-y divide-divider">
					{alerts.map((alert) => {
						const Icon = ICONS[alert.severity];
						return (
							<li key={alert.id} className="flex items-start gap-3 py-3.5">
								<span className={`grid size-8 shrink-0 place-items-center rounded-md ${ICON_TONE[alert.severity]}`}>
									<Icon className="size-4" aria-hidden="true" />
								</span>
								<div className="min-w-0 flex-1">
									<div className="flex flex-wrap items-center gap-2">
										<strong className="text-[13px]">{humanize(alert.severity)} impact</strong>
										<span className="font-mono text-[11px] text-muted">{alert.impact_force_g.toFixed(1)} g</span>
										<StatusBadge status={alert.status} />
									</div>
									<p className="mt-1 truncate text-xs text-muted">
										<Link to={`/vehicles/${alert.vehicle?.id}`} className="font-bold text-ink hover:underline">
											{alert.vehicle?.plate_number}
										</Link>{' '}
										· {alert.vehicle?.name}
										{alert.rental?.customer && ` · ${alert.rental.customer.full_name}`}
									</p>
									<p className="mt-0.5 truncate text-[11px] text-muted" title={formatDateTime(alert.occurred_at)}>
										{alert.location_name} · {timeAgo(alert.occurred_at)}
									</p>
								</div>
								<div className="flex shrink-0 flex-col gap-1.5 sm:flex-row">
									{alert.status === 'new' && (
										<button type="button" disabled={busyId === alert.id} onClick={() => updateStatus(alert.id, 'acknowledged')} className="btn btn-secondary px-2.5 py-1.5 text-[11px]">
											Acknowledge
										</button>
									)}
									<button type="button" disabled={busyId === alert.id} onClick={() => updateStatus(alert.id, 'resolved')} className="btn btn-secondary px-2.5 py-1.5 text-[11px]">
										<CheckCircle2 className="size-3.5" aria-hidden="true" /> Resolve
									</button>
								</div>
							</li>
						);
					})}
				</ul>
			)}
		</section>
	);
}
