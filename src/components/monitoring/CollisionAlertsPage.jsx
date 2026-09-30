import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { api } from '../../services/api.js';
import { useApi } from '../../hooks/useApi.js';
import { formatDateTime, humanize } from '../../utils/format.js';
import { PageHeader } from '../common/AppLayout.jsx';
import ErrorState, { EmptyState } from '../common/ErrorState.jsx';
import Pagination from '../common/Pagination.jsx';
import { TableSkeleton } from '../common/Skeleton.jsx';
import StatusBadge from '../common/StatusBadge.jsx';

const SEVERITIES = ['minor', 'moderate', 'severe', 'critical'];
const STATUSES = ['new', 'acknowledged', 'resolved'];

/** Every collision alert ever recorded, with filters and acknowledge/resolve actions. */
export default function CollisionAlertsPage() {
	const [params, setParams] = useSearchParams();
	const severity = params.get('severity') ?? '';
	const status = params.get('status') ?? '';
	const page = Number(params.get('page')) || 1;
	const [busyId, setBusyId] = useState(null);
	const [actionError, setActionError] = useState('');

	const update = (changes) =>
		setParams((prev) => {
			const next = new URLSearchParams(prev);
			Object.entries(changes).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
			if (!('page' in changes)) next.delete('page');
			return next;
		});

	const { data, loading, error, reload } = useApi((signal) => api.collisions.list({ severity, status, page, per_page: 15 }, { signal }), [severity, status, page]);
	const collisions = data?.data ?? [];

	const updateStatus = async (id, next) => {
		setBusyId(id);
		setActionError('');
		try {
			await api.collisions.update(id, next);
			reload();
		} catch (err) {
			setActionError(err.message);
		} finally {
			setBusyId(null);
		}
	};

	return (
		<>
			<PageHeader eyebrow="IoT & Alerts" title="Collision Alerts" description="Every impact detected by onboard sensors, from minor bumps to critical collisions." />

			<div className="mb-4 flex flex-wrap justify-end gap-2.5">
				{[
					{ key: 'severity', label: 'Severity', value: severity, options: SEVERITIES, onChange: (v) => update({ severity: v }) },
					{ key: 'status', label: 'Status', value: status, options: STATUSES, onChange: (v) => update({ status: v }) },
				].map(({ key, label, value, options, onChange }) => (
					<label key={key} className="sm:w-44">
						<span className="sr-only">{label}</span>
						<select value={value} onChange={(e) => onChange(e.target.value)} className="input">
							<option value="">All {label.toLowerCase()}</option>
							{options.map((o) => (
								<option key={o} value={o}>
									{humanize(o)}
								</option>
							))}
						</select>
					</label>
				))}
			</div>

			{actionError && (
				<p role="alert" className="mb-3 rounded bg-danger-soft px-3 py-2 text-xs font-semibold text-danger">
					{actionError}
				</p>
			)}

			<section className="card p-2 sm:p-4" aria-busy={loading}>
				{loading && !data ? (
					<TableSkeleton rows={8} columns={6} />
				) : error ? (
					<ErrorState error={error} onRetry={reload} />
				) : collisions.length === 0 ? (
					<EmptyState title="No collisions found" message="Try a different filter." />
				) : (
					<div className={loading ? 'opacity-60 transition-opacity' : ''}>
						<div className="hidden overflow-x-auto md:block">
							<table className="w-full">
								<thead>
									<tr>
										<th scope="col" className="th">Vehicle</th>
										<th scope="col" className="th">Severity</th>
										<th scope="col" className="th text-right">Impact</th>
										<th scope="col" className="th">Location</th>
										<th scope="col" className="th">When</th>
										<th scope="col" className="th">Status</th>
										<th scope="col" className="th"><span className="sr-only">Actions</span></th>
									</tr>
								</thead>
								<tbody>
									{collisions.map((c) => (
										<tr key={c.id} className="hover:bg-surface-2">
											<td className="td">
												<Link to={`/vehicles/${c.vehicle?.id}`} className="font-bold text-accent-strong hover:underline">
													{c.vehicle?.plate_number}
												</Link>
												<small className="block text-[11px] text-muted">{c.vehicle?.name}</small>
											</td>
											<td className="td">
												<StatusBadge status={c.severity} />
											</td>
											<td className="td text-right font-mono tabular-nums">{c.impact_force_g.toFixed(1)} g</td>
											<td className="td text-xs">{c.location_name}</td>
											<td className="td text-xs">{formatDateTime(c.occurred_at)}</td>
											<td className="td">
												<StatusBadge status={c.status} />
											</td>
											<td className="td text-right">
												<div className="flex justify-end gap-1.5">
													{c.status === 'new' && (
														<button type="button" disabled={busyId === c.id} onClick={() => updateStatus(c.id, 'acknowledged')} className="btn btn-secondary px-2.5 py-1.5 text-[11px]">
															Acknowledge
														</button>
													)}
													{c.status !== 'resolved' && (
														<button type="button" disabled={busyId === c.id} onClick={() => updateStatus(c.id, 'resolved')} className="btn btn-secondary px-2.5 py-1.5 text-[11px]">
															<CheckCircle2 className="size-3.5" aria-hidden="true" /> Resolve
														</button>
													)}
												</div>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>

						<ul className="divide-y divide-divider md:hidden">
							{collisions.map((c) => (
								<li key={c.id} className="px-2 py-3.5">
									<div className="flex items-center justify-between gap-2">
										<Link to={`/vehicles/${c.vehicle?.id}`} className="text-sm font-bold text-accent-strong hover:underline">
											{c.vehicle?.plate_number}
										</Link>
										<div className="flex gap-1.5">
											<StatusBadge status={c.severity} />
											<StatusBadge status={c.status} />
										</div>
									</div>
									<small className="mt-1 block text-xs text-muted">
										{c.location_name} · {formatDateTime(c.occurred_at)} · {c.impact_force_g.toFixed(1)} g
									</small>
									<div className="mt-2 flex gap-1.5">
										{c.status === 'new' && (
											<button type="button" disabled={busyId === c.id} onClick={() => updateStatus(c.id, 'acknowledged')} className="btn btn-secondary flex-1 py-1.5 text-[11px]">
												Acknowledge
											</button>
										)}
										{c.status !== 'resolved' && (
											<button type="button" disabled={busyId === c.id} onClick={() => updateStatus(c.id, 'resolved')} className="btn btn-secondary flex-1 py-1.5 text-[11px]">
												Resolve
											</button>
										)}
									</div>
								</li>
							))}
						</ul>
					</div>
				)}
				<Pagination meta={data?.meta} onPageChange={(p) => update({ page: String(p) })} disabled={loading} />
			</section>
		</>
	);
}
