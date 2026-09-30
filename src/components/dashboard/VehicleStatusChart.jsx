import { useState } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { api } from '../../services/api.js';
import { useApi } from '../../hooks/useApi.js';
import { formatNumber, humanize } from '../../utils/format.js';
import ChartCard from '../common/ChartCard.jsx';
import { useChartTheme, VEHICLE_STATUSES, VEHICLE_TYPES } from './chartTheme.js';

const VIEWS = {
	by_type: { label: 'By type', keys: VEHICLE_TYPES, unit: 'rentals', subtitle: 'Rentals per vehicle type, last 12 months' },
	by_status: { label: 'By status', keys: VEHICLE_STATUSES, unit: 'vehicles', subtitle: 'Current status of the fleet' },
};

/** Pie chart — rented vehicles by type, or the fleet by current status. */
export default function VehicleStatusChart() {
	const [view, setView] = useState('by_type');
	const { data, loading, error, reload } = useApi((signal) => api.dashboard.vehicleDistribution({}, { signal }));
	const chart = useChartTheme();
	const { keys, unit, subtitle } = VIEWS[view];

	const rows = (data?.data?.[view] ?? []).filter((row) => row.value > 0);
	const total = rows.reduce((sum, r) => sum + r.value, 0);

	const toggle = (
		<div className="flex rounded-md border border-divider p-0.5 text-[11px] font-bold" role="group" aria-label="Distribution view">
			{Object.entries(VIEWS).map(([key, { label }]) => (
				<button
					key={key}
					type="button"
					onClick={() => setView(key)}
					aria-pressed={view === key}
					className={`rounded px-2.5 py-1 ${view === key ? 'bg-ink text-surface' : 'text-muted hover:text-ink'}`}
				>
					{label}
				</button>
			))}
		</div>
	);

	return (
		<ChartCard
			title="Vehicle distribution"
			subtitle={subtitle}
			loading={loading}
			error={error}
			onRetry={reload}
			actions={toggle}
			table={{
				columns: [
					{ key: 'label', label: view === 'by_type' ? 'Type' : 'Status', format: humanize },
					{ key: 'value', label: humanize(unit), align: 'right', format: formatNumber },
				],
				rows,
			}}
		>
			<div className="grid items-center gap-4 sm:grid-cols-[1fr_auto]">
				<div className="h-[230px]">
					<ResponsiveContainer width="100%" height="100%">
						<PieChart>
							<Pie data={rows} dataKey="value" nameKey="label" outerRadius="92%" stroke={chart.surface} strokeWidth={2} isAnimationActive={false}>
								{rows.map((row) => (
									<Cell key={row.label} fill={chart.colorFor(keys, row.label)} />
								))}
							</Pie>
							<Tooltip {...chart.tooltipProps} formatter={(value, name) => [`${formatNumber(value)} ${unit} (${Math.round((value / total) * 100)}%)`, humanize(name)]} />
						</PieChart>
					</ResponsiveContainer>
				</div>
				<ul className="grid grid-cols-2 gap-x-5 gap-y-2 sm:grid-cols-1" aria-label="Legend">
					{rows.map((row) => (
						<li key={row.label} className="flex items-center gap-2 text-xs">
							<span className="size-2.5 shrink-0 rounded-full" style={{ background: chart.colorFor(keys, row.label) }} aria-hidden="true" />
							<span className="flex-1 font-semibold">{humanize(row.label)}</span>
							<span className="font-mono text-muted tabular-nums">{Math.round((row.value / total) * 100)}%</span>
						</li>
					))}
				</ul>
			</div>
		</ChartCard>
	);
}
