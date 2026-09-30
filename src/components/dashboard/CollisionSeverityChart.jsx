import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { AlertOctagon, AlertTriangle, CircleAlert, Info } from 'lucide-react';
import { api } from '../../services/api.js';
import { useApi } from '../../hooks/useApi.js';
import { formatNumber, humanize } from '../../utils/format.js';
import ChartCard from '../common/ChartCard.jsx';
import { useChartTheme } from './chartTheme.js';

const ICONS = { minor: Info, moderate: CircleAlert, severe: AlertTriangle, critical: AlertOctagon };

/** Doughnut chart — collision records grouped by severity. */
export default function CollisionSeverityChart() {
	const { data, loading, error, reload } = useApi((signal) => api.dashboard.collisionSeverity({}, { signal }));
	const chart = useChartTheme();
	const rows = data?.data ?? [];
	const total = rows.reduce((sum, r) => sum + r.value, 0);
	const open = rows.reduce((sum, r) => sum + r.open, 0);

	return (
		<ChartCard
			title="Collisions by severity"
			subtitle={`${formatNumber(open)} unresolved of ${formatNumber(total)} recorded`}
			loading={loading}
			error={error}
			onRetry={reload}
			table={{
				columns: [
					{ key: 'label', label: 'Severity', format: humanize },
					{ key: 'value', label: 'Total', align: 'right' },
					{ key: 'open', label: 'Unresolved', align: 'right' },
				],
				rows,
			}}
		>
			<div className="grid items-center gap-4 sm:grid-cols-[1fr_auto]">
				<div className="relative h-[230px]">
					<ResponsiveContainer width="100%" height="100%">
						<PieChart>
							<Pie
								data={rows.filter((r) => r.value > 0)}
								dataKey="value"
								nameKey="label"
								innerRadius="62%"
								outerRadius="92%"
								paddingAngle={1}
								stroke={chart.surface}
								strokeWidth={2}
								isAnimationActive={false}
							>
								{rows.filter((r) => r.value > 0).map((row) => (
									<Cell key={row.label} fill={chart.severity[row.label]} />
								))}
							</Pie>
							<Tooltip {...chart.tooltipProps} formatter={(value, name) => [`${formatNumber(value)} (${Math.round((value / total) * 100)}%)`, humanize(name)]} />
						</PieChart>
					</ResponsiveContainer>
					<div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
						<div>
							<strong className="block text-3xl font-black tracking-tight">{formatNumber(total)}</strong>
							<span className="font-mono text-[10px] tracking-wider text-muted uppercase">Collisions</span>
						</div>
					</div>
				</div>

				<ul className="grid grid-cols-2 gap-x-5 gap-y-2.5 sm:grid-cols-1" aria-label="Legend">
					{rows.map((row) => {
						const Icon = ICONS[row.label];
						return (
							<li key={row.label} className="flex items-center gap-2 text-xs">
								<Icon className="size-3.5 shrink-0" style={{ color: chart.severity[row.label] }} aria-hidden="true" />
								<span className="flex-1 font-semibold">{humanize(row.label)}</span>
								<span className="font-mono text-muted tabular-nums">{row.value}</span>
							</li>
						);
					})}
				</ul>
			</div>
		</ChartCard>
	);
}
