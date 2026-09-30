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

const STATUSES = ['pending', 'verified', 'rejected'];

/** Payment proofs submitted by renters (GCash refs, bank slips) — verify or reject each one. */
export default function PaymentVerificationList() {
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

	const { data, loading, error, reload } = useApi((signal) => api.paymentVerifications.list({ status, page, per_page: 12 }, { signal }), [status, page]);
	const items = data?.data ?? [];
	const pendingCount = data?.pending_count ?? 0;

	const decide = async (id, next, note) => {
		setBusyId(id);
		setActionError('');
		try {
			await api.paymentVerifications.decide(id, next, note || undefined);
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
			<PageHeader eyebrow="Operations" title="Payment Verification" description={`${pendingCount} submitted payment${pendingCount === 1 ? '' : 's'} awaiting review.`} />

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
					<EmptyState title="No payment submissions" message="Nothing to review for this filter." />
				) : (
					<ul className={`divide-y divide-divider ${loading ? 'opacity-60 transition-opacity' : ''}`}>
						{items.map((p) => (
							<li key={p.id} className="py-3.5">
								<div className="flex flex-wrap items-start justify-between gap-3">
									<div className="min-w-0">
										<div className="flex flex-wrap items-center gap-2">
											<Link to={`/rentals/${p.rental?.id}`} className="text-sm font-bold text-accent-strong hover:underline">
												{p.rental?.reference}
											</Link>
											<StatusBadge status={p.status} />
										</div>
										<p className="mt-1 text-xs text-muted">
											{p.rental?.customer?.full_name} · {p.rental?.vehicle?.name}
										</p>
										<p className="mt-1 text-[13px] font-bold">
											{formatCurrency(p.amount)} <span className="font-normal text-muted">via {humanize(p.method)}</span>
											{p.reference_no && <span className="ml-2 font-mono text-[11px] text-muted">Ref: {p.reference_no}</span>}
										</p>
										<p className="mt-0.5 text-[11px] text-muted">Submitted {formatDateTime(p.submitted_at)}</p>
										{p.status !== 'pending' && (
											<p className="mt-1 text-[11px] text-muted">
												{humanize(p.status)} by {p.verified_by ?? '—'} · {formatDateTime(p.verified_at)}
												{p.remarks && <span className="block italic">"{p.remarks}"</span>}
											</p>
										)}
									</div>

									{p.status === 'pending' && (
										<div className="flex shrink-0 gap-1.5">
											<button type="button" disabled={busyId === p.id} onClick={() => decide(p.id, 'verified')} className="btn btn-secondary px-2.5 py-1.5 text-[11px] hover:bg-success-soft hover:text-success">
												<Check className="size-3.5" aria-hidden="true" /> Verify
											</button>
											<button
												type="button"
												disabled={busyId === p.id}
												onClick={() => (rejectingId === p.id ? setRejectingId(null) : (setRejectingId(p.id), setRemarks('')))}
												className="btn btn-secondary px-2.5 py-1.5 text-[11px] hover:bg-danger-soft hover:text-danger"
											>
												<X className="size-3.5" aria-hidden="true" /> Reject
											</button>
										</div>
									)}
								</div>

								{rejectingId === p.id && (
									<div className="mt-3 flex flex-wrap items-center gap-2 rounded-md bg-surface-2 p-3">
										<input
											type="text"
											value={remarks}
											onChange={(e) => setRemarks(e.target.value)}
											placeholder="Reason for rejection (optional)"
											maxLength={500}
											className="input flex-1"
										/>
										<button type="button" disabled={busyId === p.id} onClick={() => decide(p.id, 'rejected', remarks)} className="btn btn-primary px-3 py-2 text-xs">
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
