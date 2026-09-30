/**
 * Central HTTP client for the ARC Laravel API.
 * - Base URL comes from VITE_API_URL (see .env.example) and must be HTTPS.
 * - Attaches the Sanctum bearer token, applies a request timeout and
 *   normalises every failure into an ApiError.
 */

const API_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '');
const REQUEST_TIMEOUT_MS = 15_000;
const SESSION_KEY = 'arc.session';

if (!API_URL) {
	throw new Error('VITE_API_URL is not configured. Copy .env.example to .env and set it.');
}

if (!API_URL.startsWith('https://')) {
	if (import.meta.env.PROD) {
		throw new Error('VITE_API_URL must use HTTPS in production builds.');
	}
	console.warn(`[api] ${API_URL} is not HTTPS. Enable SSL in Laragon and use an https:// URL.`);
}

export class ApiError extends Error {
	constructor(message, status = 0, errors = {}) {
		super(message);
		this.name = 'ApiError';
		this.status = status;
		this.errors = errors;
	}
}

/**
 * The session lives in sessionStorage so it is dropped when the browser tab
 * closes, and it also carries an expiry issued by the server.
 */
export const sessionStore = {
	get() {
		try {
			return JSON.parse(sessionStorage.getItem(SESSION_KEY)) ?? null;
		} catch {
			return null;
		}
	},
	set(session) {
		try {
			sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
		} catch {
			/* storage unavailable (private mode) — session stays in memory only */
		}
	},
	clear() {
		try {
			sessionStorage.removeItem(SESSION_KEY);
		} catch {
			/* ignore */
		}
	},
};

const STATUS_MESSAGES = {
	401: 'Your session has expired. Please sign in again.',
	403: 'You do not have permission to do that.',
	404: 'The requested record could not be found.',
	419: 'Your session has expired. Please sign in again.',
	422: 'Please check the highlighted fields.',
	426: 'A secure (HTTPS) connection is required.',
	429: 'Too many attempts. Please wait a minute and try again.',
	500: 'The server ran into a problem. Please try again shortly.',
	503: 'The service is temporarily unavailable.',
};

async function request(path, { method = 'GET', body, params, signal } = {}) {
	const url = new URL(`${API_URL}${path}`);
	Object.entries(params ?? {}).forEach(([key, value]) => {
		if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value));
	});

	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(new DOMException('timeout', 'TimeoutError')), REQUEST_TIMEOUT_MS);
	const forwardAbort = () => controller.abort(signal.reason);
	signal?.addEventListener('abort', forwardAbort, { once: true });

	const token = sessionStore.get()?.token;
	let response;

	try {
		response = await fetch(url, {
			method,
			signal: controller.signal,
			headers: {
				Accept: 'application/json',
				...(body ? { 'Content-Type': 'application/json' } : {}),
				...(token ? { Authorization: `Bearer ${token}` } : {}),
			},
			body: body ? JSON.stringify(body) : undefined,
		});
	} catch (error) {
		if (signal?.aborted) throw error;
		const timedOut = controller.signal.reason?.name === 'TimeoutError';
		throw new ApiError(timedOut ? 'The server took too long to respond.' : 'Unable to reach the server. Check your connection.', 0);
	} finally {
		clearTimeout(timeout);
		signal?.removeEventListener('abort', forwardAbort);
	}

	if (response.status === 204) return null;

	const data = await response.json().catch(() => null);

	if (!response.ok) {
		if (response.status === 401 && token) {
			window.dispatchEvent(new Event('arc:unauthorized'));
		}
		const message = response.status === 422 || !STATUS_MESSAGES[response.status] ? data?.message : STATUS_MESSAGES[response.status];
		throw new ApiError(message || STATUS_MESSAGES[response.status] || 'Something went wrong.', response.status, data?.errors ?? {});
	}

	return data;
}

const get = (path) => (params, options) => request(path, { ...options, params });

export const api = {
	auth: {
		login: (email, password) => request('/login', { method: 'POST', body: { email, password } }),
		logout: () => request('/logout', { method: 'POST' }),
		me: (options) => request('/user', options),
	},
	dashboard: {
		stats: get('/dashboard/stats'),
		rentalTrends: get('/dashboard/rental-trends'),
		vehicleDistribution: get('/dashboard/vehicle-distribution'),
		revenue: get('/dashboard/revenue'),
		collisionSeverity: get('/dashboard/collision-severity'),
	},
	vehicles: {
		list: get('/vehicles'),
		get: (id, options) => request(`/vehicles/${encodeURIComponent(id)}`, options),
	},
	customers: {
		list: get('/customers'),
		get: (id, options) => request(`/customers/${encodeURIComponent(id)}`, options),
	},
	rentals: {
		list: get('/rentals'),
		get: (id, options) => request(`/rentals/${encodeURIComponent(id)}`, options),
	},
	collisions: {
		list: get('/collisions'),
		update: (id, status) => request(`/collisions/${encodeURIComponent(id)}`, { method: 'PATCH', body: { status } }),
	},
	monitoring: {
		locations: get('/monitoring/locations'),
		trail: (vehicleId, options) => request(`/monitoring/vehicles/${encodeURIComponent(vehicleId)}/trail`, options),
		geofenceViolations: get('/monitoring/geofence-violations'),
		engineShutdowns: get('/monitoring/engine-shutdowns'),
	},
	bookings: {
		list: get('/bookings'),
		get: (id, options) => request(`/bookings/${encodeURIComponent(id)}`, options),
		updateStatus: (id, status) => request(`/bookings/${encodeURIComponent(id)}`, { method: 'PATCH', body: { status } }),
	},
	paymentVerifications: {
		list: get('/payment-verifications'),
		get: (id, options) => request(`/payment-verifications/${encodeURIComponent(id)}`, options),
		decide: (id, status, remarks) => request(`/payment-verifications/${encodeURIComponent(id)}`, { method: 'PATCH', body: { status, remarks } }),
	},
	rentalExtensions: {
		list: get('/rental-extensions'),
		get: (id, options) => request(`/rental-extensions/${encodeURIComponent(id)}`, options),
		decide: (id, status, remarks) => request(`/rental-extensions/${encodeURIComponent(id)}`, { method: 'PATCH', body: { status, remarks } }),
	},
	vehicleHealth: {
		list: get('/vehicle-health'),
		get: (id, options) => request(`/vehicle-health/${encodeURIComponent(id)}`, options),
		addLog: (id, payload) => request(`/vehicle-health/${encodeURIComponent(id)}/logs`, { method: 'POST', body: payload }),
	},
	calendar: {
		availability: get('/calendar/availability'),
	},
	alerts: {
		list: get('/alerts'),
	},
	trustScoreboard: {
		list: get('/trust-scoreboard'),
	},
};
