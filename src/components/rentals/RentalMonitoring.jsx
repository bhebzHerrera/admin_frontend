import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api.js';
import { useApi } from '../../hooks/useApi.js';
import { formatDateTime, humanize, timeAgo } from '../../utils/format.js';
import { PageHeader } from '../common/AppLayout.jsx';
import ErrorState, { EmptyState } from '../common/ErrorState.jsx';
import { TableSkeleton } from '../common/Skeleton.jsx';
import StatusBadge from '../common/StatusBadge.jsx';
import { LiveIndicator } from '../monitoring/VehicleLocation.jsx';

const POLL_MS = Number(import.meta.env.VITE_MONITORING_POLL_MS) || 15_000;

/** Live telemetry snapshot for every rental currently in progress. */
export default function RentalMonitoring() {
	const { data, loading, error, reload, updatedAt } = useApi((signal) => api.monitoring.locations({}, { signal }), [], { interval: POLL_MS });

	const activeRentals = useMemo(
		() => (data?.data ?? []).filter((v) => v.active_rental && v.latest_location).sort((a, b) => (a.active_rental.reference > b.active_rental.reference ? 1 : -1)),
		[data],
	);

	return (
		<>
			<PageHeader eyebrow="Operations" title="Rental Monitoring" description="Live GPS, speed and engine status for every rental currently on the road." />

			<div className="mb-4 flex justify-end">
				<LiveIndicator updatedAt={updatedAt} error={error && data ? error : null} />
			</div>

			<section className="card p-2 sm:p-4" aria-busy={loading}>
				{loading && !data ? (
					<TableSkeleton rows={6} columns={6} />
				) : error && !data ? (
					<ErrorState error={error} onRetry={reload} />
				) : activeRentals.length === 0 ? (
					<EmptyState title="No active rentals" message="No vehicles are currently out on rental." />
				) : (
					<>
						<div className="hidden overflow-x-auto md:block">
							<table className="w-full">
								<thead>
									<tr>
										<th scope="col" className="th">Reference</th>
										<th scope="col" className="th">Renter</th>
										<th scope="col" className="th">Vehicle</th>
										<th scope="col" className="th text-right">Speed</th>
										<th scope="col" className="th">Engine</th>
										<th scope="col" className="th">Geofence</th>
										<th scope="col" className="th">Last ping</th>
									</tr>
								</thead>
								<tbody>
									{activeRentals.map((v) => {
										const loc = v.latest_location;
										const rental = v.active_rental;
										return (
											<tr key={v.id} className="hover:bg-surface-2">
												<td className="td">
													<Link to={`/rentals/${rental.id}`} className="font-bold text-accent-strong hover:underline">
														{rental.reference}
													</Link>
												</td>
												<td className="td">{rental.customer?.full_name}</td>
												<td className="td">
													<Link to={`/vehicles/${v.id}`} className="hover:underline">
														{v.name}
													</Link>
													<small className="block text-[11px] text-muted">{v.plate_number}</small>
												</td>
												<td className="td text-right tabular-nums">{Math.round(loc.speed_kph)} km/h</td>
												<td className="td">
													<StatusBadge tone={loc.engine_status === 'shutdown' ? 'danger' : loc.engine_status === 'on' ? 'success' : 'neutral'} label={humanize(loc.engine_status)} />
												</td>
												<td className="td">
													<StatusBadge tone={loc.inside_geofence ? 'success' : 'warning'} label={loc.inside_geofence ? 'Inside' : 'Outside'} />
												</td>
												<td className="td text-xs" title={formatDateTime(loc.recorded_at)}>{timeAgo(loc.recorded_at)}</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</div>

						<ul className="divide-y divide-divider md:hidden">
							{activeRentals.map((v) => {
								const loc = v.latest_location;
								const rental = v.active_rental;
								return (
									<li key={v.id} className="px-2 py-3.5">
										<div className="flex items-center justify-between gap-2">
											<Link to={`/rentals/${rental.id}`} className="text-sm font-bold text-accent-strong hover:underline">
												{rental.reference}
											</Link>
											<StatusBadge tone={loc.engine_status === 'shutdown' ? 'danger' : loc.engine_status === 'on' ? 'success' : 'neutral'} label={humanize(loc.engine_status)} />
										</div>
										<small className="mt-1 block text-xs text-muted">
											{rental.customer?.full_name} · {v.plate_number}
										</small>
										<small className="block text-xs text-muted">
											{Math.round(loc.speed_kph)} km/h · {loc.inside_geofence ? 'Inside geofence' : 'Outside geofence'} · {timeAgo(loc.recorded_at)}
										</small>
									</li>
								);
							})}
						</ul>
					</>
				)}
			</section>
		</>
	);
}
