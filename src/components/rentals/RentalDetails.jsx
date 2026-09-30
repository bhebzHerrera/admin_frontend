import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Mail, MapPin, Phone } from 'lucide-react';
import { api } from '../../services/api.js';
import { useApi } from '../../hooks/useApi.js';
import { formatCurrency, formatDate, formatDateTime, humanize } from '../../utils/format.js';
import ErrorState, { EmptyState } from '../common/ErrorState.jsx';
import { CardSkeleton, ListSkeleton, Skeleton } from '../common/Skeleton.jsx';
import StatusBadge from '../common/StatusBadge.jsx';

export default function RentalDetails() {
	const { id } = useParams();
	const { data, loading, error, reload } = useApi((signal) => api.rentals.get(id, { signal }), [id]);
	const rental = data?.data;

	return (
		<>
			<Link to="/rentals" className="mb-5 inline-flex items-center gap-1.5 text-xs font-extrabold text-accent-strong hover:underline">
				<ArrowLeft className="size-3.5" aria-hidden="true" /> All rentals
			</Link>

			{loading && !rental ? (
				<div className="space-y-4" role="status" aria-label="Loading rental">
					<Skeleton className="h-9 w-48" />
					<div className="grid gap-4 lg:grid-cols-3">
						<CardSkeleton lines={4} />
						<CardSkeleton lines={4} />
						<CardSkeleton lines={4} />
					</div>
				</div>
			) : error ? (
				<div className="card">
					<ErrorState error={error} onRetry={error.status === 404 ? undefined : reload} />
				</div>
			) : (
				<RentalContent rental={rental} />
			)}
		</>
	);
}

function RentalContent({ rental }) {
	const { vehicle, customer } = rental;

	return (
		<>
			<div className="mb-6 flex flex-wrap items-end justify-between gap-4">
				<div>
					<p className="eyebrow">Booked {formatDateTime(rental.booked_at)}</p>
					<h1 className="mt-2 text-[31px] leading-tight font-extrabold tracking-[-0.05em]">{rental.reference}</h1>
					<p className="text-[13px] text-muted">
						{formatDateTime(rental.start_date)} → {formatDateTime(rental.end_date)} · {rental.total_days} day{rental.total_days === 1 ? '' : 's'}
					</p>
				</div>
				<div className="flex gap-2">
					<StatusBadge status={rental.reservation_status} className="text-xs" />
					<StatusBadge status={rental.payment_status} className="text-xs" />
				</div>
			</div>

			<div className="grid gap-4 lg:grid-cols-3">
				<section className="card p-5">
					<h2 className="text-base font-extrabold">Payment</h2>
					<dl className="mt-4 space-y-2.5 text-[13px]">
						<Row label="Daily rate" value={formatCurrency(rental.daily_rate)} />
						<Row label={`× ${rental.total_days} day${rental.total_days === 1 ? '' : 's'}`} value={formatCurrency(rental.total_amount)} />
						<Row label="Amount paid" value={formatCurrency(rental.amount_paid)} />
						<div className="border-t border-divider pt-2.5">
							<Row label={<b>Balance</b>} value={<b className={rental.balance > 0 ? 'text-danger' : ''}>{formatCurrency(rental.balance)}</b>} />
						</div>
						<Row label="Method" value={humanize(rental.payment_method)} />
						<Row label="Paid on" value={formatDateTime(rental.paid_at)} />
					</dl>
				</section>

				<section className="card p-5">
					<h2 className="text-base font-extrabold">Vehicle</h2>
					<Link to={`/vehicles/${vehicle.id}`} className="mt-4 block rounded-md bg-soft p-3 hover:underline">
						<b className="text-sm">{vehicle.plate_number}</b>
						<small className="block text-xs text-muted">
							{vehicle.name} {vehicle.year} · {humanize(vehicle.type)}
						</small>
					</Link>
					<dl className="mt-4 space-y-2.5 text-[13px]">
						<Row label="Pickup" value={rental.pickup_location} />
						<Row label="Returned" value={rental.returned_at ? formatDateTime(rental.returned_at) : '—'} />
						<Row label="Current status" value={<StatusBadge status={vehicle.status} />} />
					</dl>
				</section>

				<section className="card p-5">
					<h2 className="text-base font-extrabold">Renter</h2>
					<p className="mt-4 text-sm font-extrabold">{customer.full_name}</p>
					<ul className="mt-2 space-y-1.5 text-xs text-muted">
						<li className="flex items-center gap-2">
							<Mail className="size-3.5" aria-hidden="true" /> {customer.email}
						</li>
						<li className="flex items-center gap-2">
							<Phone className="size-3.5" aria-hidden="true" /> {customer.phone}
						</li>
						<li className="flex items-center gap-2">
							<MapPin className="size-3.5" aria-hidden="true" /> {customer.address}, {customer.city}
						</li>
					</ul>
					<dl className="mt-4 space-y-2.5 text-[13px]">
						<Row label="License" value={<span className="font-mono text-xs">{customer.license_number}</span>} />
						<Row label="License expiry" value={formatDate(customer.license_expiry)} />
						<Row label="Account" value={<StatusBadge status={customer.status} />} />
					</dl>
				</section>
			</div>

			<div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
				<RenterHistory customerId={customer.id} currentRentalId={rental.id} />

				<section className="card p-5">
					<h2 className="text-base font-extrabold">Incidents during this rental</h2>
					{rental.collisions.length === 0 ? (
						<EmptyState title="No incidents" message="No collisions were recorded." />
					) : (
						<ul className="mt-2 divide-y divide-divider">
							{rental.collisions.map((c) => (
								<li key={c.id} className="py-3">
									<div className="flex items-center justify-between gap-2">
										<StatusBadge status={c.severity} />
										<StatusBadge status={c.status} />
									</div>
									<p className="mt-1.5 text-[13px] font-semibold">{c.description}</p>
									<p className="text-[11px] text-muted">
										{c.location_name} · {formatDateTime(c.occurred_at)}
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

/** Rental history of the renter, loaded separately from the customer endpoint. */
function RenterHistory({ customerId, currentRentalId }) {
	const { data, loading, error, reload } = useApi((signal) => api.customers.get(customerId, { signal }), [customerId]);
	const customer = data?.data;

	return (
		<section className="card p-5">
			<h2 className="text-base font-extrabold">Renter history</h2>
			{customer && (
				<p className="mt-1 text-xs text-muted">
					{customer.rentals_count} rental{customer.rentals_count === 1 ? '' : 's'} · {formatCurrency(customer.total_spent)} paid in total
				</p>
			)}
			{loading && !customer ? (
				<ListSkeleton rows={4} />
			) : error ? (
				<ErrorState error={error} onRetry={reload} compact />
			) : (
				<ul className="mt-3 max-h-80 divide-y divide-divider overflow-y-auto">
					{customer.rentals.map((r) => (
						<li key={r.id} className={`flex items-center gap-3 py-2.5 ${r.id === currentRentalId ? 'font-bold' : ''}`}>
							<Link to={`/rentals/${r.id}`} className="w-24 shrink-0 text-xs font-bold text-accent-strong hover:underline">
								{r.reference}
							</Link>
							<span className="min-w-0 flex-1 truncate text-xs">
								{r.vehicle?.name} · {formatDate(r.start_date)}
							</span>
							<StatusBadge status={r.reservation_status} />
						</li>
					))}
				</ul>
			)}
		</section>
	);
}

function Row({ label, value }) {
	return (
		<div className="flex items-center justify-between gap-3">
			<dt className="text-muted">{label}</dt>
			<dd className="text-right font-semibold">{value}</dd>
		</div>
	);
}
