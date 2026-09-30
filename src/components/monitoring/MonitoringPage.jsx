import { PageHeader } from '../common/AppLayout.jsx';
import CollisionAlerts from './CollisionAlerts.jsx';
import GeofenceStatus from './GeofenceStatus.jsx';
import VehicleLocation from './VehicleLocation.jsx';

export default function MonitoringPage() {
	return (
		<>
			<PageHeader eyebrow="Real-time telematics" title="Live Monitoring" description="GPS positions, geofence breaches, collision alerts and engine shutdown status across the fleet." />
			<div className="space-y-4">
				<VehicleLocation height={520} showList />
				<div className="grid gap-4 xl:grid-cols-2">
					<CollisionAlerts limit={10} />
					<GeofenceStatus limit={8} />
				</div>
			</div>
		</>
	);
}
