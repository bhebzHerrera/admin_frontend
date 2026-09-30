import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Circle, CircleMarker, MapContainer, Polyline, Popup, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { api } from '../../services/api.js';
import { useApi } from '../../hooks/useApi.js';
import { timeAgo } from '../../utils/format.js';
import ErrorState from '../common/ErrorState.jsx';
import { Skeleton } from '../common/Skeleton.jsx';

const POLL_MS = Number(import.meta.env.VITE_MONITORING_POLL_MS) || 15_000;

/** Operational state of a vehicle derived from its latest GPS ping. */
const STATES = {
	moving: { label: 'Moving', color: '#1baf7a' },
	idle: { label: 'Engine on, stopped', color: '#2a78d6' },
	outside: { label: 'Outside geofence', color: '#eb6834' },
	shutdown: { label: 'Engine shut down', color: '#d03b3b' },
	parked: { label: 'Parked', color: '#8a9ba0' },
};

const LIST_PRIORITY = ['shutdown', 'outside', 'moving', 'idle'];

function vehicleState(vehicle) {
	const loc = vehicle.latest_location;
	if (!loc) return 'parked';
	if (loc.engine_status === 'shutdown') return 'shutdown';
	if (!loc.inside_geofence) return 'outside';
	if (loc.engine_status === 'on') return loc.speed_kph > 0 ? 'moving' : 'idle';
	return 'parked';
}

/** Live GPS map of the fleet with the service-area geofence; polls the API. */
export default function VehicleLocation({ height = 380, showList = false }) {
	const { data, loading, error, reload, updatedAt } = useApi((signal) => api.monitoring.locations({}, { signal }), [], { interval: POLL_MS });
	const [selectedId, setSelectedId] = useState(null);
	const [, forceTick] = useState(0);

	// Re-render every 10 s so "updated x ago" labels stay current.
	useEffect(() => {
		const t = setInterval(() => forceTick((n) => n + 1), 10_000);
		return () => clearInterval(t);
	}, []);

	const vehicles = useMemo(() => (data?.data ?? []).filter((v) => v.latest_location).map((v) => ({ ...v, state: vehicleState(v) })), [data]);
	const fence = data?.geofence;
	const selected = vehicles.find((v) => v.id === selectedId);

	const trail = useApi((signal) => (selectedId ? api.monitoring.trail(selectedId, { signal }) : Promise.resolve(null)), [selectedId, updatedAt?.getTime()]);

	const counts = vehicles.reduce((acc, v) => ({ ...acc, [v.state]: (acc[v.state] ?? 0) + 1 }), {});
	const onRoad = vehicles.filter((v) => v.state !== 'parked').sort((a, b) => LIST_PRIORITY.indexOf(a.state) - LIST_PRIORITY.indexOf(b.state));

	return (
		<section className="card min-w-0 p-5" aria-label="Live vehicle locations">
			<header className="mb-4 flex flex-wrap items-start justify-between gap-3">
				<div>
					<h2 className="text-base font-extrabold tracking-tight">Live vehicle locations</h2>
					<p className="mt-1 text-xs text-muted">{fence ? `${fence.name} · ${fence.radius_km} km geofence` : 'GPS positions from onboard trackers'}</p>
				</div>
				<LiveIndicator updatedAt={updatedAt} error={error && data ? error : null} />
			</header>

			{loading && !data ? (
				<Skeleton className="w-full" style={{ height }} />
			) : error && !data ? (
				<ErrorState error={error} onRetry={reload} />
			) : (
				<div className={showList ? 'grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]' : ''}>
					<div className="isolate overflow-hidden rounded-md border border-divider" style={{ height }}>
						<MapContainer center={[fence.latitude, fence.longitude]} zoom={11} scrollWheelZoom={showList} className="size-full">
							<TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' />
							<Circle center={[fence.latitude, fence.longitude]} radius={fence.radius_km * 1000} pathOptions={{ color: '#25aaa1', weight: 1.5, dashArray: '6 6', fillOpacity: 0.04 }} />
							{trail.data?.data?.length > 1 && (
								<Polyline positions={trail.data.data.map((p) => [p.latitude, p.longitude])} pathOptions={{ color: '#2a78d6', weight: 3, opacity: 0.8 }} />
							)}
							{vehicles.map((v) => (
								<CircleMarker
									key={v.id}
									center={[v.latest_location.latitude, v.latest_location.longitude]}
									radius={v.id === selectedId ? 10 : 7}
									pathOptions={{ color: '#ffffff', weight: 2, fillColor: STATES[v.state].color, fillOpacity: 1 }}
									eventHandlers={{ click: () => setSelectedId(v.id) }}
								>
									<Popup>
										<VehiclePopup vehicle={v} />
									</Popup>
								</CircleMarker>
							))}
							<FlyTo vehicle={selected} />
						</MapContainer>
					</div>

					{showList && (
						<div className="max-h-[520px] overflow-y-auto rounded-md border border-divider" style={{ maxHeight: height }}>
							<p className="sticky top-0 border-b border-divider bg-surface px-3 py-2.5 font-mono text-[10px] tracking-wider text-muted uppercase">On the road ({onRoad.length})</p>
							<ul className="divide-y divide-divider">
								{onRoad.map((v) => (
									<li key={v.id}>
										<button
											type="button"
											onClick={() => setSelectedId(v.id)}
											className={`flex w-full items-center gap-3 px-3 py-3 text-left hover:bg-soft ${v.id === selectedId ? 'bg-soft' : ''}`}
											aria-pressed={v.id === selectedId}
										>
											<span className="size-2.5 shrink-0 rounded-full" style={{ background: STATES[v.state].color }} aria-hidden="true" />
											<span className="min-w-0 flex-1">
												<strong className="block truncate text-xs">
													{v.plate_number} · {v.name}
												</strong>
												<small className="block truncate text-[11px] text-muted">
													{STATES[v.state].label} · {Math.round(v.latest_location.speed_kph)} km/h · {timeAgo(v.latest_location.recorded_at)}
												</small>
											</span>
										</button>
									</li>
								))}
							</ul>
						</div>
					)}
				</div>
			)}

			{vehicles.length > 0 && (
				<ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2" aria-label="Map legend">
					{Object.entries(STATES).map(([key, { label, color }]) => (
						<li key={key} className="flex items-center gap-1.5 text-[11px] text-muted">
							<span className="size-2.5 rounded-full" style={{ background: color }} aria-hidden="true" />
							{label} <b className="font-mono text-ink">{counts[key] ?? 0}</b>
						</li>
					))}
				</ul>
			)}
		</section>
	);
}

function FlyTo({ vehicle }) {
	const map = useMap();
	const lat = vehicle?.latest_location.latitude;
	const lng = vehicle?.latest_location.longitude;
	useEffect(() => {
		if (lat != null) map.flyTo([lat, lng], Math.max(map.getZoom(), 13), { duration: 0.8 });
	}, [vehicle?.id, lat, lng, map]);
	return null;
}

function VehiclePopup({ vehicle }) {
	const loc = vehicle.latest_location;
	const renter = vehicle.active_rental?.customer;
	return (
		<div className="min-w-[180px] space-y-1 text-xs">
			<strong className="block text-sm">{vehicle.plate_number}</strong>
			<span className="block">{vehicle.name}</span>
			<span className="block">
				<b>{STATES[vehicle.state].label}</b> · {Math.round(loc.speed_kph)} km/h
			</span>
			<span className="block">Engine: {loc.engine_status}</span>
			{renter && <span className="block">Renter: {renter.full_name}</span>}
			<span className="block text-[11px] opacity-70">
				{loc.latitude.toFixed(5)}, {loc.longitude.toFixed(5)} · {timeAgo(loc.recorded_at)}
			</span>
			<Link to={`/vehicles/${vehicle.id}`} className="block pt-1 font-bold">
				View vehicle →
			</Link>
		</div>
	);
}

export function LiveIndicator({ updatedAt, error }) {
	return (
		<span className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 font-mono text-[10px] uppercase ${error ? 'bg-warning-soft text-warning' : 'bg-success-soft text-success'}`} role="status">
			<span className="relative flex size-2">
				{!error && <span className="absolute inline-flex size-full animate-ping rounded-full bg-current opacity-60" />}
				<span className="relative inline-flex size-2 rounded-full bg-current" />
			</span>
			{error ? 'Reconnecting…' : `Live · ${updatedAt ? timeAgo(updatedAt.toISOString()) : 'now'}`}
		</span>
	);
}
