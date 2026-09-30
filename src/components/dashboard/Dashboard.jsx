import { useAuth } from '../../context/AuthContext.jsx';
import { api } from '../../services/api.js';
import { useApi } from '../../hooks/useApi.js';
import { PageHeader } from '../common/AppLayout.jsx';
import ErrorBoundary from '../common/ErrorBoundary.jsx';
import CollisionAlerts from '../monitoring/CollisionAlerts.jsx';
import GeofenceStatus from '../monitoring/GeofenceStatus.jsx';
import VehicleLocation from '../monitoring/VehicleLocation.jsx';
import CollisionSeverityChart from './CollisionSeverityChart.jsx';
import DashboardCards from './DashboardCards.jsx';
import RentalChart from './RentalChart.jsx';
import RevenueChart from './RevenueChart.jsx';
import VehicleStatusChart from './VehicleStatusChart.jsx';

function greeting() {
	const hour = new Date().getHours();
	return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
}

const today = new Intl.DateTimeFormat('en-PH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());

/** Each widget fetches independently and sits in its own error boundary, so one failure never blanks the page. */
function Widget({ children }) {
	return <ErrorBoundary>{children}</ErrorBoundary>;
}

export default function Dashboard() {
	const { user } = useAuth();
	const stats = useApi((signal) => api.dashboard.stats({}, { signal }), [], { interval: 60_000 });

	return (
		<>
			<PageHeader
				eyebrow={`${today} · Live operations`}
				title={`${greeting()}, ${user?.name?.split(' ')[0] ?? 'there'}`}
				description="Here's what's happening across your fleet today."
			/>

			<div className="space-y-4">
				<Widget>
					<DashboardCards stats={stats.data?.data} loading={stats.loading} error={stats.error} onRetry={stats.reload} />
				</Widget>

				<div className="grid gap-4 lg:grid-cols-2">
					<Widget>
						<RentalChart />
					</Widget>
					<Widget>
						<VehicleStatusChart />
					</Widget>
					<Widget>
						<RevenueChart />
					</Widget>
					<Widget>
						<CollisionSeverityChart />
					</Widget>
				</div>

				<div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
					<Widget>
						<VehicleLocation height={400} />
					</Widget>
					<div className="min-w-0 space-y-4">
						<Widget>
							<CollisionAlerts limit={4} showViewAll />
						</Widget>
						<Widget>
							<GeofenceStatus limit={3} />
						</Widget>
					</div>
				</div>
			</div>
		</>
	);
}
