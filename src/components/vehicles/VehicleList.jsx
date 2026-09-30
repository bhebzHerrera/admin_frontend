import { Link, useSearchParams } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { api } from '../../services/api.js';
import { useApi } from '../../hooks/useApi.js';
import { formatCurrency, humanize, timeAgo } from '../../utils/format.js';
import { PageHeader } from '../common/AppLayout.jsx';
import ErrorState, { EmptyState } from '../common/ErrorState.jsx';
import ListFilters from '../common/ListFilters.jsx';
import Pagination from '../common/Pagination.jsx';
import { TableSkeleton } from '../common/Skeleton.jsx';
import StatusBadge from '../common/StatusBadge.jsx';
import { VEHICLE_STATUSES, VEHICLE_TYPES } from '../dashboard/chartTheme.js';

export default function VehicleList() {
	const [params, setParams] = useSearchParams();
	const search = params.get('search') ?? '';
	const status = params.get('status') ?? '';
	const type = params.get('type') ?? '';
	const page = Number(params.get('page')) || 1;

	// Filters live in the URL so they survive refresh and back/forward navigation.
	const update = (changes) =>
		setParams((prev) => {
			const next = new URLSearchParams(prev);
			Object.entries(changes).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
			if (!('page' in changes)) next.delete('page');
			return next;
		});

	const { data, loading, error, reload } = useApi((signal) => api.vehicles.list({ search, status, type, page, per_page: 12 }, { signal }), [search, status, type, page]);
	const vehicles = data?.data ?? [];

	return (
		<>
			<PageHeader eyebrow="Fleet" title="Vehicles" description="Rental vehicles with their type, availability, daily rate and live tracker status." />

			<ListFilters
				search={search}
				onSearch={(value) => update({ search: value })}
				placeholder="Search plate, make or model…"
				filters={[
					{ key: 'status', label: 'Statuses', value: status, options: VEHICLE_STATUSES, onChange: (v) => update({ status: v }) },
					{ key: 'type', label: 'Types', value: type, options: VEHICLE_TYPES, onChange: (v) => update({ type: v }) },
				]}
			/>

			<section className="card p-2 sm:p-4" aria-busy={loading}>
				{loading && !data ? (
					<TableSkeleton rows={8} columns={6} />
				) : error ? (
					<ErrorState error={error} onRetry={reload} />
				) : vehicles.length === 0 ? (
					<EmptyState title="No vehicles found" message="Try a different search or filter." />
				) : (
					<div className={loading ? 'opacity-60 transition-opacity' : ''}>
						{/* Desktop table */}
						<div className="hidden overflow-x-auto md:block">
							<table className="w-full">
								<thead>
									<tr>
										<th scope="col" className="th">Vehicle</th>
										<th scope="col" className="th">Type</th>
										<th scope="col" className="th text-right">Rate / day</th>
										<th scope="col" className="th">Availability</th>
										<th scope="col" className="th">Tracker</th>
										<th scope="col" className="th text-right">Rentals</th>
										<th scope="col" className="th"><span className="sr-only">Actions</span></th>
									</tr>
								</thead>
								<tbody>
									{vehicles.map((v) => (
										<tr key={v.id} className="hover:bg-surface-2">
											<td className="td">
												<Link to={`/vehicles/${v.id}`} className="font-bold text-accent-strong hover:underline">
													{v.plate_number}
												</Link>
												<small className="block text-[11px] text-muted">
													{v.name} · {v.year}
												</small>
											</td>
											<td className="td">
												{humanize(v.type)}
												<small className="block text-[11px] text-muted">
													{v.seats} seats · {humanize(v.transmission)}
												</small>
											</td>
											<td className="td text-right tabular-nums">{formatCurrency(v.daily_rate)}</td>
											<td className="td">
												<StatusBadge status={v.status} />
											</td>
											<td className="td text-[12px] text-muted">
												{v.latest_location ? (
													<>
														<span className="font-mono text-ink">{v.gps_device_id}</span>
														<small className="block">
															Engine {v.latest_location.engine_status} · {timeAgo(v.latest_location.recorded_at)}
														</small>
													</>
												) : (
													'No signal'
												)}
											</td>
											<td className="td text-right tabular-nums">{v.rentals_count}</td>
											<td className="td text-right">
												<Link to={`/vehicles/${v.id}`} className="inline-flex items-center text-xs font-extrabold text-accent-strong hover:underline" aria-label={`View ${v.plate_number}`}>
													View <ChevronRight className="size-3.5" />
												</Link>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>

						{/* Mobile cards */}
						<ul className="divide-y divide-divider md:hidden">
							{vehicles.map((v) => (
								<li key={v.id}>
									<Link to={`/vehicles/${v.id}`} className="flex items-center gap-3 px-2 py-3.5">
										<div className="min-w-0 flex-1">
											<strong className="block text-sm">{v.plate_number}</strong>
											<small className="block truncate text-xs text-muted">
												{v.name} · {humanize(v.type)} · {formatCurrency(v.daily_rate)}/day
											</small>
										</div>
										<StatusBadge status={v.status} />
										<ChevronRight className="size-4 text-muted" aria-hidden="true" />
									</Link>
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
