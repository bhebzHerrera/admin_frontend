import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Mail, MapPin, Phone } from 'lucide-react';
import { api } from '../../services/api.js';
import { useApi } from '../../hooks/useApi.js';
import { formatCurrency, formatDate, formatDateRange } from '../../utils/format.js';
import ErrorState, { EmptyState } from '../common/ErrorState.jsx';
import { CardSkeleton, ListSkeleton, Skeleton } from '../common/Skeleton.jsx';
import StatusBadge from '../common/StatusBadge.jsx';

export default function CustomerDetails() {
	const { id } = useParams();
	const { data, loading, error, reload } = useApi((signal) => api.customers.get(id, { signal }), [id]);
	const customer = data?.data;

	return (
		<>
			<Link to="/customers" className="mb-5 inline-flex items-center gap-1.5 text-xs font-extrabold text-accent-strong hover:underline">
				<ArrowLeft className="size-3.5" aria-hidden="true" /> All customers
			</Link>

			{loading && !customer ? (
				<div className="space-y-4" role="status" aria-label="Loading customer">
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
				<CustomerContent customer={customer} />
			)}
		</>
	);
}

function CustomerContent({ customer }) {
	return (
		<>
			<div className="mb-6 flex flex-wrap items-end justify-between gap-4">
				<div>
					<p className="eyebrow">Customer since {formatDate(customer.created_at)}</p>
					<h1 className="mt-2 text-[31px] leading-tight font-extrabold tracking-[-0.05em]">{customer.full_name}</h1>
					<p className="text-[13px] text-muted">
						{customer.rentals_count} rental{customer.rentals_count === 1 ? '' : 's'} · {formatCurrency(customer.total_spent)} paid in total
					</p>
				</div>
				<StatusBadge status={customer.status} className="text-xs" />
			</div>

			<div className="grid gap-4 lg:grid-cols-3">
				<section className="card p-5">
					<h2 className="text-base font-extrabold">Contact</h2>
					<ul className="mt-4 space-y-2.5 text-[13px]">
						<li className="flex items-center gap-2">
							<Mail className="size-3.5 text-muted" aria-hidden="true" /> {customer.email}
						</li>
						<li className="flex items-center gap-2">
							<Phone className="size-3.5 text-muted" aria-hidden="true" /> {customer.phone}
						</li>
						<li className="flex items-center gap-2">
							<MapPin className="size-3.5 text-muted" aria-hidden="true" /> {customer.address}, {customer.city}
						</li>
					</ul>
				</section>

				<section className="card p-5">
					<h2 className="text-base font-extrabold">License</h2>
					<dl className="mt-4 space-y-2.5 text-[13px]">
						<Row label="Number" value={<span className="font-mono text-xs">{customer.license_number}</span>} />
						<Row label="Expiry" value={formatDate(customer.license_expiry)} />
						<Row label="Date of birth" value={formatDate(customer.date_of_birth)} />
					</dl>
				</section>

				<section className="card p-5">
					<h2 className="text-base font-extrabold">Standing</h2>
					<dl className="mt-4 space-y-2.5 text-[13px]">
						<Row label="Account status" value={<StatusBadge status={customer.status} />} />
						<Row label="Total rentals" value={customer.rentals_count} />
						<Row label="Total spent" value={formatCurrency(customer.total_spent)} />
					</dl>
				</section>
			</div>

			<section className="card mt-4 p-5">
				<h2 className="text-base font-extrabold">Rental history</h2>
				{!customer.rentals || customer.rentals.length === 0 ? (
					<EmptyState title="No rentals yet" message="This customer hasn't made a booking." />
				) : (
					<ul className="mt-3 divide-y divide-divider">
						{customer.rentals.map((r) => (
							<li key={r.id} className="flex flex-wrap items-center gap-3 py-3">
								<Link to={`/rentals/${r.id}`} className="w-28 shrink-0 text-xs font-bold text-accent-strong hover:underline">
									{r.reference}
								</Link>
								<span className="min-w-0 flex-1 truncate text-xs">
									{r.vehicle?.name} · {formatDateRange(r.start_date, r.end_date)}
								</span>
								<span className="w-24 shrink-0 text-right text-xs tabular-nums">{formatCurrency(r.total_amount)}</span>
								<StatusBadge status={r.reservation_status} />
								<StatusBadge status={r.payment_status} />
							</li>
						))}
					</ul>
				)}
			</section>
		</>
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
