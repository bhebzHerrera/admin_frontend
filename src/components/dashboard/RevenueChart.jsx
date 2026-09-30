import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api } from '../../services/api.js';
import { useApi } from '../../hooks/useApi.js';
import { formatCompactCurrency, formatCurrency, formatNumber } from '../../utils/format.js';
import ChartCard from '../common/ChartCard.jsx';
import { useChartTheme } from './chartTheme.js';

/**
 * Line charts — monthly revenue and payment transactions.
 * Revenue (₱) and transaction counts have different scales, so they are drawn
 * as two aligned small multiples sharing the month axis instead of a dual axis.
 */
export default function RevenueChart() {
	const { data, loading, error, reload } = useApi((signal) => api.dashboard.revenue({}, { signal }));
	const chart = useChartTheme();
	const rows = data?.data ?? [];

	const total = rows.reduce((sum, r) => sum + r.revenue, 0);
	const [prev, last] = rows.slice(-2);
	const change = prev?.revenue ? ((last.revenue - prev.revenue) / prev.revenue) * 100 : null;

	return (
		<ChartCard
			title="Revenue & transactions"
			subtitle="Payments collected per month, last 12 months"
			loading={loading}
			error={error}
			onRetry={reload}
			height={300}
			table={{
				columns: [
					{ key: 'month', label: 'Month' },
					{ key: 'revenue', label: 'Revenue', align: 'right', format: (v) => formatCurrency(v) },
					{ key: 'transactions', label: 'Transactions', align: 'right', format: formatNumber },
					{ key: 'average', label: 'Avg. ticket', align: 'right', format: (v) => formatCurrency(v) },
				],
				rows,
			}}
		>
			<div className="mb-3 flex flex-wrap items-baseline gap-x-3">
				<span className="text-[28px] font-black tracking-[-0.06em]">{formatCurrency(total)}</span>
				{change !== null && (
					<span className={`font-mono text-[11px] ${change >= 0 ? 'text-success' : 'text-danger'}`}>
						{change >= 0 ? '▲' : '▼'} {Math.abs(change).toFixed(1)}% vs last month
					</span>
				)}
			</div>

			<SmallMultiple title="Revenue" rows={rows} dataKey="revenue" color={chart.series[0]} chart={chart} tickFormatter={formatCompactCurrency} valueFormatter={(v) => formatCurrency(v)} />
			<SmallMultiple title="Transactions" rows={rows} dataKey="transactions" color={chart.series[0]} chart={chart} tickFormatter={formatNumber} valueFormatter={formatNumber} showXAxis />
		</ChartCard>
	);
}

function SmallMultiple({ title, rows, dataKey, color, chart, tickFormatter, valueFormatter, showXAxis = false }) {
	return (
		<figure className="mt-1">
			<figcaption className="font-mono text-[10px] tracking-wider text-muted uppercase">{title}</figcaption>
			<div className={showXAxis ? 'h-[128px]' : 'h-[104px]'}>
				<ResponsiveContainer width="100%" height="100%">
					<LineChart data={rows} syncId="revenue" margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
						<CartesianGrid vertical={false} stroke={chart.grid} />
						<XAxis dataKey="month" {...chart.axisProps} hide={!showXAxis} tickFormatter={(m) => m.slice(0, 3)} interval="preserveStartEnd" minTickGap={8} />
						<YAxis {...chart.axisProps} axisLine={false} width={58} tickFormatter={tickFormatter} tickCount={3} />
						<Tooltip {...chart.tooltipProps} cursor={{ stroke: chart.axis, strokeDasharray: '3 3' }} formatter={(value) => [valueFormatter(value), title]} />
						<Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={false} activeDot={{ r: 4, stroke: chart.surface, strokeWidth: 2 }} />
					</LineChart>
				</ResponsiveContainer>
			</div>
		</figure>
	);
}
