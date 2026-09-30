import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '../../services/api.js';
import { useApi } from '../../hooks/useApi.js';
import { PageHeader } from '../common/AppLayout.jsx';
import ErrorState, { EmptyState } from '../common/ErrorState.jsx';
import { Skeleton } from '../common/Skeleton.jsx';

const STATUS_DOT = {
	pending: 'bg-warning',
	confirmed: 'bg-accent-strong',
	active: 'bg-info',
	completed: 'bg-success',
};

const monthLabel = new Intl.DateTimeFormat('en-PH', { month: 'long', year: 'numeric' });

function ymOf(date) {
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

/** A month-at-a-glance grid of which vehicle is booked on which day. */
export default function AvailabilityCalendar() {
	const [cursor, setCursor] = useState(() => new Date());
	const month = ymOf(cursor);
	const [search, setSearch] = useState('');

	const { data, loading, error, reload } = useApi((signal) => api.calendar.availability({ month }, { signal }), [month]);

	const days = useMemo(() => {
		const [y, m] = month.split('-').map(Number);
		return new Date(y, m, 0).getDate();
	}, [month]);

	const vehicles = data?.data?.vehicles ?? [];
	const bookings = data?.data?.bookings ?? [];

	const byVehicle = useMemo(() => {
		const map = new Map();
		vehicles.forEach((v) => map.set(v.id, Array(days).fill(null)));
		bookings.forEach((b) => {
			const cells = map.get(b.vehicle_id);
			if (!cells) return;
			const start = new Date(b.start_date);
			const end = new Date(b.end_date);
			for (let day = 1; day <= days; day++) {
				const [y, m] = month.split('-').map(Number);
				const cellDate = new Date(y, m - 1, day, 12);
				if (cellDate >= new Date(start.getFullYear(), start.getMonth(), start.getDate()) && cellDate <= new Date(end.getFullYear(), end.getMonth(), end.getDate())) {
					cells[day - 1] = b;
				}
			}
		});
		return map;
	}, [vehicles, bookings, days, month]);

	const visibleVehicles = vehicles.filter((v) => !search || `${v.plate_number} ${v.name}`.toLowerCase().includes(search.toLowerCase()));

	return (
		<>
			<PageHeader eyebrow="Fleet" title="Availability Calendar" description="Which vehicle is booked, and when, at a glance." />

			<div className="mb-4 flex flex-wrap items-center justify-between gap-3">
				<div className="flex items-center gap-2">
					<button type="button" onClick={() => setCursor((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))} className="btn btn-secondary size-9 justify-center p-0" aria-label="Previous month">
						<ChevronLeft className="size-4" />
					</button>
					<strong className="w-40 text-center text-sm">{monthLabel.format(cursor)}</strong>
					<button type="button" onClick={() => setCursor((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))} className="btn btn-secondary size-9 justify-center p-0" aria-label="Next month">
						<ChevronRight className="size-4" />
					</button>
					<button type="button" onClick={() => setCursor(new Date())} className="btn btn-secondary px-3 py-2 text-xs">
						Today
					</button>
				</div>
				<input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Filter vehicles…" className="input sm:w-56" />
			</div>

			<ul className="mb-3 flex flex-wrap gap-x-4 gap-y-1.5" aria-label="Legend">
				{Object.entries(STATUS_DOT).map(([status, cls]) => (
					<li key={status} className="flex items-center gap-1.5 text-[11px] text-muted">
						<span className={`size-2.5 rounded-full ${cls}`} aria-hidden="true" /> {status[0].toUpperCase() + status.slice(1)}
					</li>
				))}
			</ul>

			<section className="card overflow-hidden p-0" aria-busy={loading}>
				{loading && !data ? (
					<div className="space-y-2 p-5">
						{Array.from({ length: 8 }, (_, i) => (
							<Skeleton key={i} className="h-8 w-full" />
						))}
					</div>
				) : error ? (
					<div className="p-5">
						<ErrorState error={error} onRetry={reload} />
					</div>
				) : visibleVehicles.length === 0 ? (
					<div className="p-5">
						<EmptyState title="No vehicles" message="No vehicles match your filter." />
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full border-separate border-spacing-0 text-[11px]">
							<thead>
								<tr>
									<th className="th sticky left-0 z-10 bg-surface text-left">Vehicle</th>
									{Array.from({ length: days }, (_, i) => (
										<th key={i} className="th px-1.5 py-2 text-center font-mono">
											{i + 1}
										</th>
									))}
								</tr>
							</thead>
							<tbody>
								{visibleVehicles.map((v) => (
									<tr key={v.id} className="hover:bg-surface-2">
										<td className="td sticky left-0 z-10 bg-surface font-bold whitespace-nowrap">
											<Link to={`/vehicles/${v.id}`} className="hover:underline">
												{v.plate_number}
											</Link>
											<small className="block font-normal text-muted">{v.name}</small>
										</td>
										{(byVehicle.get(v.id) ?? []).map((booking, i) => (
											<td key={i} className="border-b border-divider p-0.5 text-center">
												{booking ? (
													<Link
														to={`/rentals/${booking.id}`}
														title={`${booking.reference} · ${booking.customer_name ?? ''}`}
														className={`block h-6 w-full rounded-sm ${STATUS_DOT[booking.reservation_status] ?? 'bg-muted'} opacity-80 hover:opacity-100`}
													/>
												) : (
													<span className="block h-6 w-full rounded-sm bg-surface-2" aria-hidden="true" />
												)}
											</td>
										))}
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</section>
		</>
	);
}
