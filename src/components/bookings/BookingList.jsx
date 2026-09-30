import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Check, ChevronRight, X } from 'lucide-react';
import { api } from '../../services/api.js';
import { useApi } from '../../hooks/useApi.js';
import { formatCurrency, formatDateRange } from '../../utils/format.js';
import { PageHeader } from '../common/AppLayout.jsx';
import ErrorState, { EmptyState } from '../common/ErrorState.jsx';
import ListFilters from '../common/ListFilters.jsx';
import Pagination from '../common/Pagination.jsx';
import { TableSkeleton } from '../common/Skeleton.jsx';
import StatusBadge from '../common/StatusBadge.jsx';

const STATUSES = ['pending', 'confirmed'];

/** Booking requests awaiting staff action, oldest first — confirm or cancel each one. */
export default function BookingList() {
	const [params, setParams] = useSearchParams();
	const search = params.get('search') ?? '';
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

	const { data, loading, error, reload } = useApi((signal) => api.bookings.list({ search, status, page, per_page: 15 }, { signal }), [search, status, page]);
	const bookings = data?.data ?? [];
	const pendingCount = data?.pending_count ?? 0;

	const act = async (id, next) => {
		setBusyId(id);
		setActionError('');
		try {
			await api.bookings.updateStatus(id, next);
			reload();
		} catch (err) {
			setActionError(err.message);
		} finally {
			setBusyId(null);
		}
	};

	return (
		<>
			<PageHeader eyebrow="Operations" title="Bookings" description={`${pendingCount} booking${pendingCount === 1 ? '' : 's'} waiting on confirmation.`} />

			<ListFilters
				search={search}
				onSearch={(value) => update({ search: value })}
				placeholder="Search reference, renter or plate…"
				filters={[{ key: 'status', label: 'Status', value: status, options: STATUSES, onChange: (v) => update({ status: v }) }]}
			/>

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
				) : bookings.length === 0 ? (
					<EmptyState title="No bookings" message="Nothing is waiting on confirmation right now." />
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
										<th scope="col" className="th">Status</th>
										<th scope="col" className="th"><span className="sr-only">Actions</span></th>
									</tr>
								</thead>
								<tbody>
									{bookings.map((b) => (
										<tr key={b.id} className="hover:bg-surface-2">
											<td className="td">
												<Link to={`/rentals/${b.id}`} className="font-bold text-accent-strong hover:underline">
													{b.reference}
												</Link>
											</td>
											<td className="td">{b.customer?.full_name}</td>
											<td className="td">
												{b.vehicle?.name}
												<small className="block text-[11px] text-muted">{b.vehicle?.plate_number}</small>
											</td>
											<td className="td text-xs">{formatDateRange(b.start_date, b.end_date)}</td>
											<td className="td text-right tabular-nums">{formatCurrency(b.total_amount)}</td>
											<td className="td">
												<StatusBadge status={b.reservation_status} />
											</td>
											<td className="td">
												<div className="flex items-center justify-end gap-1.5">
													{b.reservation_status === 'pending' && (
														<button type="button" disabled={busyId === b.id} onClick={() => act(b.id, 'confirmed')} className="btn btn-secondary px-2.5 py-1.5 text-[11px]">
															<Check className="size-3.5" aria-hidden="true" /> Confirm
														</button>
													)}
													<button type="button" disabled={busyId === b.id} onClick={() => act(b.id, 'cancelled')} className="btn btn-secondary px-2.5 py-1.5 text-[11px] hover:bg-danger-soft hover:text-danger">
														<X className="size-3.5" aria-hidden="true" /> Cancel
													</button>
												</div>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>

						<ul className="divide-y divide-divider md:hidden">
							{bookings.map((b) => (
								<li key={b.id} className="px-2 py-3.5">
									<div className="flex items-center justify-between gap-2">
										<Link to={`/rentals/${b.id}`} className="text-sm font-bold text-accent-strong hover:underline">
											{b.reference}
										</Link>
										<StatusBadge status={b.reservation_status} />
									</div>
									<small className="mt-1 block text-xs text-muted">
										{b.customer?.full_name} · {b.vehicle?.name}
									</small>
									<small className="block text-xs text-muted">
										{formatDateRange(b.start_date, b.end_date)} · {formatCurrency(b.total_amount)}
									</small>
									<div className="mt-2 flex items-center gap-1.5">
										{b.reservation_status === 'pending' && (
											<button type="button" disabled={busyId === b.id} onClick={() => act(b.id, 'confirmed')} className="btn btn-secondary flex-1 py-1.5 text-[11px]">
												<Check className="size-3.5" aria-hidden="true" /> Confirm
											</button>
										)}
										<button type="button" disabled={busyId === b.id} onClick={() => act(b.id, 'cancelled')} className="btn btn-secondary flex-1 py-1.5 text-[11px] hover:bg-danger-soft hover:text-danger">
											<X className="size-3.5" aria-hidden="true" /> Cancel
										</button>
										<Link to={`/rentals/${b.id}`} className="grid size-8 shrink-0 place-items-center text-accent-strong" aria-label={`View ${b.reference}`}>
											<ChevronRight className="size-4" />
										</Link>
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
