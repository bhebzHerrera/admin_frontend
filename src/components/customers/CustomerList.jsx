import { Link, useSearchParams } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { api } from '../../services/api.js';
import { useApi } from '../../hooks/useApi.js';
import { formatCurrency } from '../../utils/format.js';
import { PageHeader } from '../common/AppLayout.jsx';
import ErrorState, { EmptyState } from '../common/ErrorState.jsx';
import ListFilters from '../common/ListFilters.jsx';
import Pagination from '../common/Pagination.jsx';
import { TableSkeleton } from '../common/Skeleton.jsx';
import StatusBadge from '../common/StatusBadge.jsx';

const STATUSES = ['active', 'suspended'];

export default function CustomerList() {
	const [params, setParams] = useSearchParams();
	const search = params.get('search') ?? '';
	const status = params.get('status') ?? '';
	const page = Number(params.get('page')) || 1;

	const update = (changes) =>
		setParams((prev) => {
			const next = new URLSearchParams(prev);
			Object.entries(changes).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
			if (!('page' in changes)) next.delete('page');
			return next;
		});

	const { data, loading, error, reload } = useApi((signal) => api.customers.list({ search, status, page, per_page: 15 }, { signal }), [search, status, page]);
	const customers = data?.data ?? [];

	return (
		<>
			<PageHeader eyebrow="Customers" title="Customers" description="Every renter on file, with their rental history and account status." />

			<ListFilters
				search={search}
				onSearch={(value) => update({ search: value })}
				placeholder="Search name, email, phone or license…"
				filters={[{ key: 'status', label: 'Status', value: status, options: STATUSES, onChange: (v) => update({ status: v }) }]}
			/>

			<section className="card p-2 sm:p-4" aria-busy={loading}>
				{loading && !data ? (
					<TableSkeleton rows={10} columns={5} />
				) : error ? (
					<ErrorState error={error} onRetry={reload} />
				) : customers.length === 0 ? (
					<EmptyState title="No customers found" message="Try a different search or filter." />
				) : (
					<div className={loading ? 'opacity-60 transition-opacity' : ''}>
						<div className="hidden overflow-x-auto md:block">
							<table className="w-full">
								<thead>
									<tr>
										<th scope="col" className="th">Name</th>
										<th scope="col" className="th">Contact</th>
										<th scope="col" className="th">City</th>
										<th scope="col" className="th text-right">Rentals</th>
										<th scope="col" className="th text-right">Total paid</th>
										<th scope="col" className="th">Status</th>
										<th scope="col" className="th"><span className="sr-only">Actions</span></th>
									</tr>
								</thead>
								<tbody>
									{customers.map((c) => (
										<tr key={c.id} className="hover:bg-surface-2">
											<td className="td">
												<Link to={`/customers/${c.id}`} className="font-bold text-accent-strong hover:underline">
													{c.full_name}
												</Link>
												<small className="block text-[11px] text-muted">{c.license_number}</small>
											</td>
											<td className="td text-xs">
												{c.email}
												<small className="block text-[11px] text-muted">{c.phone}</small>
											</td>
											<td className="td text-xs">{c.city}</td>
											<td className="td text-right tabular-nums">{c.rentals_count}</td>
											<td className="td text-right tabular-nums">{formatCurrency(c.total_spent)}</td>
											<td className="td">
												<StatusBadge status={c.status} />
											</td>
											<td className="td text-right">
												<Link to={`/customers/${c.id}`} className="inline-flex items-center text-xs font-extrabold text-accent-strong hover:underline" aria-label={`View ${c.full_name}`}>
													View <ChevronRight className="size-3.5" />
												</Link>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>

						<ul className="divide-y divide-divider md:hidden">
							{customers.map((c) => (
								<li key={c.id}>
									<Link to={`/customers/${c.id}`} className="block px-2 py-3.5">
										<div className="flex items-center justify-between gap-2">
											<strong className="text-sm">{c.full_name}</strong>
											<StatusBadge status={c.status} />
										</div>
										<small className="mt-1 block text-xs text-muted">
											{c.email} · {c.phone}
										</small>
										<small className="block text-xs text-muted">
											{c.rentals_count} rental{c.rentals_count === 1 ? '' : 's'} · {formatCurrency(c.total_spent)} paid
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
