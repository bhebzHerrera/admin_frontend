import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, MapPin } from 'lucide-react';
import { api } from '../../services/api.js';
import { useApi } from '../../hooks/useApi.js';
import { formatCurrency, formatDateRange, formatDateTime, formatNumber, humanize, timeAgo } from '../../utils/format.js';
import ErrorState, { EmptyState } from '../common/ErrorState.jsx';
import { CardSkeleton, Skeleton, TableSkeleton } from '../common/Skeleton.jsx';
import StatusBadge from '../common/StatusBadge.jsx';

export default function VehicleDetails() {
	const { id } = useParams();
	const { data, loading, error, reload } = useApi((signal) => api.vehicles.get(id, { signal }), [id]);
	const vehicle = data?.data;

	return (
		<>
			<Link to="/vehicles" className="mb-5 inline-flex items-center gap-1.5 text-xs font-extrabold text-accent-strong hover:underline">
				<ArrowLeft className="size-3.5" aria-hidden="true" /> All vehicles
			</Link>

			{loading && !vehicle ? (
				<DetailsSkeleton />
			) : error ? (
				<div className="card">
					<ErrorState error={error} onRetry={error.status === 404 ? undefined : reload} />
				</div>
			) : (
				<VehicleContent vehicle={vehicle} />
			)}
		</>
	);
}

function VehicleContent({ vehicle }) {
	const loc = vehicle.latest_location;
	const specs = [
		['Make & model', `${vehicle.make} ${vehicle.model}`],
		['Year', vehicle.year],
		['Type', humanize(vehicle.type)],
		['Color', vehicle.color],
		['Transmission', humanize(vehicle.transmission)],
		['Fuel', humanize(vehicle.fuel_type)],
		['Seats', vehicle.seats],
		['Mileage', `${formatNumber(vehicle.mileage_km)} km`],
		['GPS device', vehicle.gps_device_id],
	];

	return (
		<>
			<div className="mb-6 flex flex-wrap items-end justify-between gap-4">
				<div>
					<p className="eyebrow">Vehicle #{vehicle.id}</p>
					<h1 className="mt-2 text-[31px] leading-tight font-extrabold tracking-[-0.05em]">{vehicle.plate_number}</h1>
					<p className="text-[13px] text-muted">
						{vehicle.name} {vehicle.year} · {formatCurrency(vehicle.daily_rate)} per day
					</p>
				</div>
				<StatusBadge status={vehicle.status} className="text-xs" />
			</div>

			<div className="mb-4 grid gap-3.5 sm:grid-cols-3">
				<Stat label="Total rentals" value={formatNumber(vehicle.rentals_count)} />
				<Stat label="Revenue collected" value={formatCurrency(vehicle.total_revenue)} />
				<Stat label="Collisions recorded" value={formatNumber(vehicle.collisions_count)} alert={vehicle.collisions_count > 0} />
			</div>

			<div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
				<section className="card p-5">
					<h2 className="text-base font-extrabold">Specifications</h2>
					<dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
						{specs.map(([label, value]) => (
							<div key={label}>
								<dt className="font-mono text-[10px] tracking-wider text-muted uppercase">{label}</dt>
								<dd className="mt-1 text-[13px] font-bold">{value}</dd>
							</div>
						))}
					</dl>
				</section>

				<section className="card space-y-4 p-5">
					<div>
						<h2 className="text-base font-extrabold">Live status</h2>
						{loc ? (
							<div className="mt-3 space-y-1.5 text-[13px]">
								<p className="flex items-center gap-2">
									<MapPin className="size-4 text-accent" aria-hidden="true" />
									<span className="font-mono text-xs">
										{loc.latitude.toFixed(5)}, {loc.longitude.toFixed(5)}
									</span>
								</p>
								<p>
									Engine <b>{loc.engine_status}</b> · {Math.round(loc.speed_kph)} km/h · {loc.inside_geofence ? 'inside geofence' : <b className="text-danger">outside geofence</b>}
								</p>
								<p className="text-xs text-muted">Last ping {timeAgo(loc.recorded_at)}</p>
							</div>
						) : (
							<p className="mt-2 text-xs text-muted">No GPS data received.</p>
						)}
					</div>
					<div className="border-t border-divider pt-4">
						<h3 className="text-sm font-extrabold">Current rental</h3>
						{vehicle.active_rental ? (
							<Link to={`/rentals/${vehicle.active_rental.id}`} className="mt-2 block rounded-md bg-soft p-3 text-[13px] hover:underline">
								<b>{vehicle.active_rental.reference}</b> · {vehicle.active_rental.customer?.full_name}
								<small className="block text-xs text-muted">Due back {formatDateTime(vehicle.active_rental.end_date)}</small>
							</Link>
						) : (
							<p className="mt-2 text-xs text-muted">Not currently rented.</p>
						)}
					</div>
				</section>
			</div>

			<div className="mt-4 grid gap-4 lg:grid-cols-[1.3fr_1fr]">
				<section className="card p-5">
					<h2 className="text-base font-extrabold">Recent rentals</h2>
					{vehicle.rentals.length === 0 ? (
						<EmptyState title="No rentals yet" />
					) : (
						<div className="mt-3 overflow-x-auto">
							<table className="w-full min-w-[520px]">
								<thead>
									<tr>
										<th scope="col" className="th">Reference</th>
										<th scope="col" className="th">Renter</th>
										<th scope="col" className="th">Dates</th>
										<th scope="col" className="th">Status</th>
									</tr>
								</thead>
								<tbody>
									{vehicle.rentals.map((r) => (
										<tr key={r.id}>
											<td className="td">
												<Link to={`/rentals/${r.id}`} className="font-bold text-accent-strong hover:underline">
													{r.reference}
												</Link>
											</td>
											<td className="td">{r.customer?.full_name}</td>
											<td className="td text-xs">{formatDateRange(r.start_date, r.end_date)}</td>
											<td className="td">
												<StatusBadge status={r.reservation_status} />
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</section>

				<section className="card p-5">
					<h2 className="text-base font-extrabold">Collision history</h2>
					{vehicle.collisions.length === 0 ? (
						<EmptyState title="No collisions" message="This vehicle has a clean record." />
					) : (
						<ul className="mt-2 divide-y divide-divider">
							{vehicle.collisions.map((c) => (
								<li key={c.id} className="py-3">
									<div className="flex items-center justify-between gap-2">
										<StatusBadge status={c.severity} />
										<StatusBadge status={c.status} />
									</div>
									<p className="mt-1.5 text-[13px] font-semibold">{c.description}</p>
									<p className="text-[11px] text-muted">
										{c.location_name} · {c.impact_force_g.toFixed(1)} g · {formatDateTime(c.occurred_at)}
									</p>
								</li>
							))}
						</ul>
					)}
				</section>
			</div>
		</>
	);
}

function Stat({ label, value, alert }) {
	return (
		<article className="card p-5">
			<span className="text-[13px] text-muted">{label}</span>
			<strong className={`mt-2 block text-[28px] font-black tracking-[-0.06em] ${alert ? 'text-danger' : ''}`}>{value}</strong>
		</article>
	);
}

function DetailsSkeleton() {
	return (
		<div className="space-y-4" role="status" aria-label="Loading vehicle">
			<Skeleton className="h-9 w-48" />
			<Skeleton className="h-4 w-72" />
			<div className="grid gap-3.5 sm:grid-cols-3">
				<CardSkeleton />
				<CardSkeleton />
				<CardSkeleton />
			</div>
			<div className="card p-5">
				<TableSkeleton rows={5} columns={4} />
			</div>
		</div>
	);
}
