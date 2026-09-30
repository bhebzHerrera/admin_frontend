import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../../services/api.js';
import { useApi } from '../../hooks/useApi.js';
import { humanize } from '../../utils/format.js';
import { PageHeader } from '../common/AppLayout.jsx';
import ErrorState, { EmptyState } from '../common/ErrorState.jsx';
import ListFilters from '../common/ListFilters.jsx';
import Pagination from '../common/Pagination.jsx';
import { ListSkeleton } from '../common/Skeleton.jsx';
import StatusBadge from '../common/StatusBadge.jsx';

const SCORE_COLOR = { excellent: 'text-success', good: 'text-accent-strong', fair: 'text-warning', at_risk: 'text-danger' };

/** Renter reliability leaderboard — a computed 0-100 score from each customer's rental behaviour, worst first. */
export default function TrustScoreboard() {
	const [params, setParams] = useSearchParams();
	const search = params.get('search') ?? '';
	const page = Number(params.get('page')) || 1;

	const update = (changes) =>
		setParams((prev) => {
			const next = new URLSearchParams(prev);
			Object.entries(changes).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
			if (!('page' in changes)) next.delete('page');
			return next;
		});

	const { data, loading, error, reload } = useApi((signal) => api.trustScoreboard.list({ search, page, per_page: 15 }, { signal }), [search, page]);
	const customers = data?.data ?? [];
	const atRiskCount = data?.at_risk_count ?? 0;

	return (
		<>
			<PageHeader eyebrow="Customers" title="Trust Scoreboard" description={`${atRiskCount} customer${atRiskCount === 1 ? '' : 's'} flagged as at-risk from cancellations, late returns or collisions.`} />

			<ListFilters search={search} onSearch={(value) => update({ search: value })} placeholder="Search name or email…" filters={[]} />

			<section className="card p-2 sm:p-4" aria-busy={loading}>
				{loading && !data ? (
					<ListSkeleton rows={8} />
				) : error ? (
					<ErrorState error={error} onRetry={reload} />
				) : customers.length === 0 ? (
					<EmptyState title="No customers found" message="Try a different search." />
				) : (
					<ul className={`divide-y divide-divider ${loading ? 'opacity-60 transition-opacity' : ''}`}>
						{customers.map((c) => (
							<li key={c.id} className="flex items-start gap-3 py-3.5">
								<span className={`grid size-11 shrink-0 place-items-center rounded-md bg-soft font-mono text-base font-black ${SCORE_COLOR[c.tier]}`}>{c.score}</span>
								<div className="min-w-0 flex-1">
									<div className="flex flex-wrap items-center gap-2">
										<Link to={`/customers/${c.id}`} className="text-sm font-bold hover:underline">
											{c.full_name}
										</Link>
										<StatusBadge status={c.tier} label={humanize(c.tier)} />
									</div>
									<p className="mt-0.5 text-xs text-muted">{c.email}</p>
									<p className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-muted">
										<span>{c.completed_rentals} completed</span>
										{c.cancelled_rentals > 0 && <span className="text-warning">{c.cancelled_rentals} cancelled</span>}
										{c.late_returns > 0 && <span className="text-warning">{c.late_returns} late return{c.late_returns === 1 ? '' : 's'}</span>}
										{c.collisions_caused > 0 && <span className="text-danger">{c.collisions_caused} collision{c.collisions_caused === 1 ? '' : 's'}</span>}
										{c.unpaid_completed > 0 && <span className="text-danger">{c.unpaid_completed} unpaid</span>}
									</p>
								</div>
							</li>
						))}
					</ul>
				)}
				<Pagination meta={data?.meta} onPageChange={(p) => update({ page: String(p) })} disabled={loading} />
			</section>
		</>
	);
}
