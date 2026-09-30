import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api } from '../../services/api.js';
import { useApi } from '../../hooks/useApi.js';
import { formatNumber } from '../../utils/format.js';
import ChartCard from '../common/ChartCard.jsx';
import { useChartTheme } from './chartTheme.js';

/** Bar chart — monthly rentals started vs. new bookings received (last 12 months). */
export default function RentalChart() {
	const { data, loading, error, reload } = useApi((signal) => api.dashboard.rentalTrends({}, { signal }));
	const chart = useChartTheme();
	const rows = data?.data ?? [];

	const totalRentals = rows.reduce((sum, r) => sum + r.rentals, 0);
	const peak = rows.reduce((best, r) => (r.rentals > (best?.rentals ?? -1) ? r : best), null);

	return (
		<ChartCard
			title="Rental & booking trends"
			subtitle={peak ? `${formatNumber(totalRentals)} rentals in 12 months · busiest: ${peak.month}` : 'Monthly rentals and new bookings'}
			loading={loading}
			error={error}
			onRetry={reload}
			table={{
				columns: [
					{ key: 'month', label: 'Month' },
					{ key: 'rentals', label: 'Rentals', align: 'right' },
					{ key: 'bookings', label: 'Bookings', align: 'right' },
					{ key: 'cancellations', label: 'Cancelled', align: 'right' },
				],
				rows,
			}}
		>
			<div className="h-[260px]">
				<ResponsiveContainer width="100%" height="100%">
					<BarChart data={rows} barGap={2} barCategoryGap="22%" margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
						<CartesianGrid vertical={false} stroke={chart.grid} />
						<XAxis dataKey="month" {...chart.axisProps} tickFormatter={(m) => m.slice(0, 3)} interval="preserveStartEnd" minTickGap={8} />
						<YAxis {...chart.axisProps} axisLine={false} allowDecimals={false} />
						<Tooltip {...chart.tooltipProps} formatter={(value, name) => [formatNumber(value), name]} />
						<Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
						<Bar dataKey="rentals" name="Rentals started" fill={chart.series[0]} radius={[4, 4, 0, 0]} maxBarSize={18} />
						<Bar dataKey="bookings" name="New bookings" fill={chart.series[1]} radius={[4, 4, 0, 0]} maxBarSize={18} />
					</BarChart>
				</ResponsiveContainer>
			</div>
		</ChartCard>
	);
}
