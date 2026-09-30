import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronDown, ChevronUp, HeartPulse, Plus } from 'lucide-react';
import { api } from '../../services/api.js';
import { useApi } from '../../hooks/useApi.js';
import { formatCurrency, formatDate, humanize } from '../../utils/format.js';
import { PageHeader } from '../common/AppLayout.jsx';
import ErrorState, { EmptyState } from '../common/ErrorState.jsx';
import ListFilters from '../common/ListFilters.jsx';
import Pagination from '../common/Pagination.jsx';
import { ListSkeleton } from '../common/Skeleton.jsx';
import StatusBadge from '../common/StatusBadge.jsx';

const MAINTENANCE_TYPES = ['oil_change', 'tire_rotation', 'brake_service', 'battery', 'inspection', 'repair', 'car_wash', 'other'];

const SCORE_COLOR = { excellent: 'text-success', good: 'text-accent-strong', fair: 'text-warning', poor: 'text-danger' };

/** Fleet reliability overview: a computed 0-100 health score per vehicle from its incident and service history. */
export default function VehicleHealth() {
	const [params, setParams] = useSearchParams();
	const search = params.get('search') ?? '';
	const page = Number(params.get('page')) || 1;
	const [expandedId, setExpandedId] = useState(null);

	const update = (changes) =>
		setParams((prev) => {
			const next = new URLSearchParams(prev);
			Object.entries(changes).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
			if (!('page' in changes)) next.delete('page');
			return next;
		});

	const { data, loading, error, reload } = useApi((signal) => api.vehicleHealth.list({ search, page, per_page: 12 }, { signal }), [search, page]);
	const vehicles = data?.data ?? [];
	const poorCount = data?.poor_count ?? 0;

	return (
		<>
			<PageHeader eyebrow="Fleet" title="Vehicle Health" description={`${poorCount} vehicle${poorCount === 1 ? '' : 's'} in poor condition and needing attention.`} />

			<ListFilters search={search} onSearch={(value) => update({ search: value })} placeholder="Search plate, make or model…" filters={[]} />

			<section className="card p-2 sm:p-4" aria-busy={loading}>
				{loading && !data ? (
					<ListSkeleton rows={6} />
				) : error ? (
					<ErrorState error={error} onRetry={reload} />
				) : vehicles.length === 0 ? (
					<EmptyState title="No vehicles found" message="Try a different search." />
				) : (
					<ul className={`divide-y divide-divider ${loading ? 'opacity-60 transition-opacity' : ''}`}>
						{vehicles.map((v) => (
							<VehicleHealthRow key={v.id} vehicle={v} expanded={expandedId === v.id} onToggle={() => setExpandedId(expandedId === v.id ? null : v.id)} />
						))}
					</ul>
				)}
				<Pagination meta={data?.meta} onPageChange={(p) => update({ page: String(p) })} disabled={loading} />
			</section>
		</>
	);
}

function VehicleHealthRow({ vehicle, expanded, onToggle }) {
	const detail = useApi((signal) => (expanded ? api.vehicleHealth.get(vehicle.id, { signal }) : Promise.resolve(null)), [expanded, vehicle.id]);

	return (
		<li className="py-3.5">
			<button type="button" onClick={onToggle} className="flex w-full items-start justify-between gap-3 text-left" aria-expanded={expanded}>
				<div className="flex min-w-0 items-start gap-3">
					<span className={`grid size-11 shrink-0 place-items-center rounded-md bg-soft font-mono text-base font-black ${SCORE_COLOR[vehicle.tier]}`}>{vehicle.score}</span>
					<div className="min-w-0">
						<div className="flex flex-wrap items-center gap-2">
							<Link to={`/vehicles/${vehicle.id}`} onClick={(e) => e.stopPropagation()} className="text-sm font-bold hover:underline">
								{vehicle.plate_number}
							</Link>
							<StatusBadge status={vehicle.tier} label={humanize(vehicle.tier)} />
						</div>
						<p className="mt-0.5 text-xs text-muted">{vehicle.name}</p>
						<p className="mt-1 text-[11px] text-muted">
							{vehicle.collisions_count ?? 0} collision{vehicle.collisions_count === 1 ? '' : 's'} · {vehicle.engine_shutdowns_count ?? 0} shutdown{vehicle.engine_shutdowns_count === 1 ? '' : 's'}
							{vehicle.overdue_maintenance_count > 0 && <span className="text-danger"> · {vehicle.overdue_maintenance_count} overdue service</span>}
						</p>
					</div>
				</div>
				{expanded ? <ChevronUp className="size-4 shrink-0 text-muted" /> : <ChevronDown className="size-4 shrink-0 text-muted" />}
			</button>

			{expanded && (
				<div className="mt-3 rounded-md bg-surface-2 p-3.5">
					{detail.error ? (
						<ErrorState error={detail.error} onRetry={detail.reload} compact />
					) : !detail.data ? (
						// Also covers the one-render gap right after expanding, before the fetch effect has run.
						<ListSkeleton rows={2} />
					) : (
						<>
							<div className="mb-3 flex flex-wrap gap-x-5 gap-y-1 text-[11px] text-muted">
								<span>Last service: {formatDate(detail.data.data.last_service_at)}</span>
								<span>Next due: {formatDate(detail.data.data.next_due_at)}</span>
							</div>
							{detail.data.data.maintenance_logs.length === 0 ? (
								<p className="text-xs text-muted">No maintenance logged yet.</p>
							) : (
								<ul className="mb-3 space-y-2">
									{detail.data.data.maintenance_logs.map((log) => (
										<li key={log.id} className="flex items-center justify-between gap-2 text-xs">
											<span className="min-w-0 flex-1">
												<b>{humanize(log.type)}</b> <span className="text-muted">— {log.description}</span>
											</span>
											<StatusBadge status={log.status} />
											<span className="w-20 text-right tabular-nums text-muted">{log.cost > 0 ? formatCurrency(log.cost) : '—'}</span>
											<span className="w-24 text-right text-muted">{formatDate(log.performed_at ?? log.next_due_at)}</span>
										</li>
									))}
								</ul>
							)}
							<AddLogForm vehicleId={vehicle.id} onAdded={detail.reload} />
						</>
					)}
				</div>
			)}
		</li>
	);
}

function AddLogForm({ vehicleId, onAdded }) {
	const [open, setOpen] = useState(false);
	const [type, setType] = useState('oil_change');
	const [description, setDescription] = useState('');
	const [cost, setCost] = useState('');
	const [saving, setSaving] = useState(false);
	const [formError, setFormError] = useState('');

	const submit = async (e) => {
		e.preventDefault();
		if (!description.trim()) {
			setFormError('Please describe what was done.');
			return;
		}
		setSaving(true);
		setFormError('');
		try {
			await api.vehicleHealth.addLog(vehicleId, { type, description: description.trim(), cost: cost ? Number(cost) : 0 });
			setDescription('');
			setCost('');
			setOpen(false);
			onAdded();
		} catch (err) {
			setFormError(err.message);
		} finally {
			setSaving(false);
		}
	};

	if (!open) {
		return (
			<button type="button" onClick={() => setOpen(true)} className="btn btn-secondary px-3 py-2 text-xs">
				<Plus className="size-3.5" aria-hidden="true" /> Log maintenance
			</button>
		);
	}

	return (
		<form onSubmit={submit} className="flex flex-wrap items-end gap-2 border-t border-divider pt-3">
			<label className="text-xs">
				<span className="mb-1 block text-muted">Type</span>
				<select value={type} onChange={(e) => setType(e.target.value)} className="input py-1.5 text-xs">
					{MAINTENANCE_TYPES.map((t) => (
						<option key={t} value={t}>
							{humanize(t)}
						</option>
					))}
				</select>
			</label>
			<label className="min-w-40 flex-1 text-xs">
				<span className="mb-1 block text-muted">Description</span>
				<input type="text" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} className="input py-1.5 text-xs" placeholder="What was done…" />
			</label>
			<label className="w-24 text-xs">
				<span className="mb-1 block text-muted">Cost (₱)</span>
				<input type="number" min="0" value={cost} onChange={(e) => setCost(e.target.value)} className="input py-1.5 text-xs" />
			</label>
			<button type="submit" disabled={saving} className="btn btn-primary px-3 py-2 text-xs">
				<HeartPulse className="size-3.5" aria-hidden="true" /> Save
			</button>
			<button type="button" onClick={() => setOpen(false)} className="btn btn-secondary px-3 py-2 text-xs">
				Cancel
			</button>
			{formError && <p className="w-full text-xs text-danger">{formError}</p>}
		</form>
	);
}
