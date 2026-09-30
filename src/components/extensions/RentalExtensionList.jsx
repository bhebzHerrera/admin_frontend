import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Check, X } from 'lucide-react';
import { api } from '../../services/api.js';
import { useApi } from '../../hooks/useApi.js';
import { formatCurrency, formatDateTime, humanize } from '../../utils/format.js';
import { PageHeader } from '../common/AppLayout.jsx';
import ErrorState, { EmptyState } from '../common/ErrorState.jsx';
import Pagination from '../common/Pagination.jsx';
import { ListSkeleton } from '../common/Skeleton.jsx';
import StatusBadge from '../common/StatusBadge.jsx';

const STATUSES = ['pending', 'approved', 'rejected'];

/** Renter requests to push back a rental's return date — approve or reject each one. */
export default function RentalExtensionList() {
	const [params, setParams] = useSearchParams();
	const status = params.get('status') ?? '';
	const page = Number(params.get('page')) || 1;
	const [busyId, setBusyId] = useState(null);
	const [rejectingId, setRejectingId] = useState(null);
	const [remarks, setRemarks] = useState('');
	const [actionError, setActionError] = useState('');

	const update = (changes) =>
		setParams((prev) => {
			const next = new URLSearchParams(prev);
			Object.entries(changes).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
			if (!('page' in changes)) next.delete('page');
			return next;
		});

	const { data, loading, error, reload } = useApi((signal) => api.rentalExtensions.list({ status, page, per_page: 12 }, { signal }), [status, page]);
	const items = data?.data ?? [];
	const pendingCount = data?.pending_count ?? 0;

	const decide = async (id, next, note) => {
		setBusyId(id);
		setActionError('');
		try {
			await api.rentalExtensions.decide(id, next, note || undefined);
			setRejectingId(null);
			setRemarks('');
			reload();
		} catch (err) {
			setActionError(err.message);
		} finally {
			setBusyId(null);
		}
	};

	return (
		<>
			<PageHeader eyebrow="Operations" title="Rental Extensions" description={`${pendingCount} extension request${pendingCount === 1 ? '' : 's'} awaiting a decision.`} />

			<div className="mb-4 flex justify-end">
				<label className="sm:w-48">
					<span className="sr-only">Status</span>
					<select value={status} onChange={(e) => update({ status: e.target.value })} className="input">
						<option value="">All statuses</option>
						{STATUSES.map((s) => (
							<option key={s} value={s}>
								{humanize(s)}
							</option>
						))}
					</select>
				</label>
			</div>

			{actionError && (
				<p role="alert" className="mb-3 rounded bg-danger-soft px-3 py-2 text-xs font-semibold text-danger">
					{actionError}
				</p>
			)}

			<section className="card p-2 sm:p-4" aria-busy={loading}>
				{loading && !data ? (
					<ListSkeleton rows={6} />
				) : error ? (
					<ErrorState error={error} onRetry={reload} />
				) : items.length === 0 ? (
					<EmptyState title="No extension requests" message="Nothing to review for this filter." />
				) : (
					<ul className={`divide-y divide-divider ${loading ? 'opacity-60 transition-opacity' : ''}`}>
						{items.map((e) => (
							<li key={e.id} className="py-3.5">
								<div className="flex flex-wrap items-start justify-between gap-3">
									<div className="min-w-0">
										<div className="flex flex-wrap items-center gap-2">
											<Link to={`/rentals/${e.rental?.id}`} className="text-sm font-bold text-accent-strong hover:underline">
												{e.rental?.reference}
											</Link>
											<StatusBadge status={e.status} />
										</div>
										<p className="mt-1 text-xs text-muted">
											{e.rental?.customer?.full_name} · {e.rental?.vehicle?.name}
										</p>
										<p className="mt-1 text-[13px] font-bold">
											+{e.additional_days} day{e.additional_days === 1 ? '' : 's'} <span className="font-normal text-muted">→ {formatDateTime(e.requested_end_date)}</span>
											<span className="ml-2 font-normal text-muted">({formatCurrency(e.additional_amount)})</span>
										</p>
										{e.reason && <p className="mt-1 text-xs text-muted italic">"{e.reason}"</p>}
										<p className="mt-0.5 text-[11px] text-muted">Requested {formatDateTime(e.requested_at)}</p>
										{e.status !== 'pending' && (
											<p className="mt-1 text-[11px] text-muted">
												{humanize(e.status)} by {e.decided_by ?? '—'} · {formatDateTime(e.decided_at)}
												{e.remarks && <span className="block italic">"{e.remarks}"</span>}
											</p>
										)}
									</div>

									{e.status === 'pending' && (
										<div className="flex shrink-0 gap-1.5">
											<button type="button" disabled={busyId === e.id} onClick={() => decide(e.id, 'approved')} className="btn btn-secondary px-2.5 py-1.5 text-[11px] hover:bg-success-soft hover:text-success">
												<Check className="size-3.5" aria-hidden="true" /> Approve
											</button>
											<button
												type="button"
												disabled={busyId === e.id}
												onClick={() => (rejectingId === e.id ? setRejectingId(null) : (setRejectingId(e.id), setRemarks('')))}
												className="btn btn-secondary px-2.5 py-1.5 text-[11px] hover:bg-danger-soft hover:text-danger"
											>
												<X className="size-3.5" aria-hidden="true" /> Reject
											</button>
										</div>
									)}
								</div>

								{rejectingId === e.id && (
									<div className="mt-3 flex flex-wrap items-center gap-2 rounded-md bg-surface-2 p-3">
										<input
											type="text"
											value={remarks}
											onChange={(ev) => setRemarks(ev.target.value)}
											placeholder="Reason for rejection (optional)"
											maxLength={500}
											className="input flex-1"
										/>
										<button type="button" disabled={busyId === e.id} onClick={() => decide(e.id, 'rejected', remarks)} className="btn btn-primary px-3 py-2 text-xs">
											Confirm rejection
										</button>
									</div>
								)}
							</li>
						))}
					</ul>
				)}
				<Pagination meta={data?.meta} onPageChange={(pg) => update({ page: String(pg) })} disabled={loading} />
			</section>
		</>
	);
}
