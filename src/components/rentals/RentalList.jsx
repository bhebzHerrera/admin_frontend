import { Link, useSearchParams } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { api } from '../../services/api.js';
import { useApi } from '../../hooks/useApi.js';
import { formatCurrency, formatDateRange } from '../../utils/format.js';
import { PageHeader } from '../common/AppLayout.jsx';
import ErrorState, { EmptyState } from '../common/ErrorState.jsx';
import ListFilters from '../common/ListFilters.jsx';
import Pagination from '../common/Pagination.jsx';
import { TableSkeleton } from '../common/Skeleton.jsx';
import StatusBadge from '../common/StatusBadge.jsx';

const RESERVATION_STATUSES = ['pending', 'confirmed', 'active', 'completed', 'cancelled'];
const PAYMENT_STATUSES = ['unpaid', 'partial', 'paid', 'refunded'];

export default function RentalList() {
	const [params, setParams] = useSearchParams();
	const search = params.get('search') ?? '';
	const status = params.get('status') ?? '';
	const payment = params.get('payment_status') ?? '';
	const page = Number(params.get('page')) || 1;

	const update = (changes) =>
		setParams((prev) => {
			const next = new URLSearchParams(prev);
			Object.entries(changes).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
			if (!('page' in changes)) next.delete('page');
			return next;
		});

	const { data, loading, error, reload } = useApi(
		(signal) => api.rentals.list({ search, status, payment_status: payment, page, per_page: 15 }, { signal }),
		[search, status, payment, page],
	);
	const rentals = data?.data ?? [];

	return (
		<>
			<PageHeader eyebrow="Transactions" title="Rentals" description="Every reservation with its renter, vehicle, rental dates, reservation status and payment." />

			<ListFilters
				search={search}
				onSearch={(value) => update({ search: value })}
				placeholder="Search reference, renter or plate…"
				filters={[
					{ key: 'status', label: 'Reservations', value: status, options: RESERVATION_STATUSES, onChange: (v) => update({ status: v }) },
					{ key: 'payment', label: 'Payments', value: payment, options: PAYMENT_STATUSES, onChange: (v) => update({ payment_status: v }) },
				]}
			/>

			<section className="card p-2 sm:p-4" aria-busy={loading}>
				{loading && !data ? (
					<TableSkeleton rows={10} columns={6} />
				) : error ? (
					<ErrorState error={error} onRetry={reload} />
				) : rentals.length === 0 ? (
					<EmptyState title="No rentals found" message="Try a different search or filter." />
				) : (
					<div className={loading ? 'opacity-60 transition-opacity' : ''}>
						<div className="hidden overflow-x-auto md:block">
							<table className="w-full">
								<thead>
									<tr>
										<th scope="col" className="th">Reference</th>
										<th scope="col" className="th">Renter</th>
										<th scope="col" className="th">Vehicle</th>
										<th scope="col" className="th">Rental dates</th>
										<th scope="col" className="th text-right">Amount</th>
										<th scope="col" className="th">Reservation</th>
										<th scope="col" className="th">Payment</th>
										<th scope="col" className="th"><span className="sr-only">Actions</span></th>
									</tr>
								</thead>
								<tbody>
									{rentals.map((r) => (
										<tr key={r.id} className="hover:bg-surface-2">
											<td className="td">
												<Link to={`/rentals/${r.id}`} className="font-bold text-accent-strong hover:underline">
													{r.reference}
												</Link>
												<small className="block text-[11px] text-muted">{r.total_days} day{r.total_days === 1 ? '' : 's'}</small>
											</td>
											<td className="td">{r.customer?.full_name}</td>
											<td className="td">
												{r.vehicle?.name}
												<small className="block text-[11px] text-muted">{r.vehicle?.plate_number}</small>
											</td>
											<td className="td text-xs">{formatDateRange(r.start_date, r.end_date)}</td>
											<td className="td text-right tabular-nums">{formatCurrency(r.total_amount)}</td>
											<td className="td">
												<StatusBadge status={r.reservation_status} />
											</td>
											<td className="td">
												<StatusBadge status={r.payment_status} />
											</td>
											<td className="td text-right">
												<Link to={`/rentals/${r.id}`} className="inline-flex items-center text-xs font-extrabold text-accent-strong hover:underline" aria-label={`View ${r.reference}`}>
													View <ChevronRight className="size-3.5" />
												</Link>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>

						<ul className="divide-y divide-divider md:hidden">
							{rentals.map((r) => (
								<li key={r.id}>
									<Link to={`/rentals/${r.id}`} className="block px-2 py-3.5">
										<div className="flex items-center justify-between gap-2">
											<strong className="text-sm">{r.reference}</strong>
											<StatusBadge status={r.reservation_status} />
										</div>
										<small className="mt-1 block text-xs text-muted">
											{r.customer?.full_name} · {r.vehicle?.name}
										</small>
										<small className="block text-xs text-muted">
											{formatDateRange(r.start_date, r.end_date)} · {formatCurrency(r.total_amount)}
										</small>
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
