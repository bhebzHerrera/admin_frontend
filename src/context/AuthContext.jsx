import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { api, sessionStore } from '../services/api.js';

const AuthContext = createContext(null);

const IDLE_TIMEOUT_MS = (Number(import.meta.env.VITE_IDLE_TIMEOUT_MINUTES) || 30) * 60_000;
const ACTIVITY_EVENTS = ['pointerdown', 'keydown', 'scroll', 'touchstart'];

function restoreSession() {
	const saved = sessionStore.get();
	if (saved?.token && new Date(saved.expiresAt) > new Date()) return saved;
	sessionStore.clear();
	return null;
}

/**
 * Session management:
 * - token + expiry + user kept in sessionStorage (cleared when the tab closes)
 * - token verified against /api/user on load
 * - automatic sign-out when the token expires, after inactivity,
 *   or when any request returns 401
 */
export function AuthProvider({ children }) {
	const [session, setSession] = useState(restoreSession);
	const [verifying, setVerifying] = useState(() => Boolean(session));
	const [notice, setNotice] = useState(null);
	const lastActivity = useRef(Date.now());

	const endSession = useCallback((message = null) => {
		sessionStore.clear();
		setSession(null);
		setNotice(message);
	}, []);

	const login = useCallback(async (email, password) => {
		const response = await api.auth.login(email, password);
		const next = { token: response.token, expiresAt: response.expires_at, user: response.user };
		sessionStore.set(next);
		lastActivity.current = Date.now();
		setNotice(null);
		setSession(next);
		return next.user;
	}, []);

	const logout = useCallback(
		async (message = null) => {
			try {
				await api.auth.logout();
			} catch {
				/* token may already be invalid — clear locally regardless */
			} finally {
				endSession(message);
			}
		},
		[endSession],
	);

	// Verify a restored token once on startup.
	useEffect(() => {
		if (!verifying) return undefined;
		const controller = new AbortController();
		api.auth
			.me({ signal: controller.signal })
			.then(({ data }) => {
				setSession((current) => {
					if (!current) return current;
					const next = { ...current, user: data };
					sessionStore.set(next);
					return next;
				});
			})
			.catch((error) => {
				if (error.status === 401) endSession('Your session has expired. Please sign in again.');
			})
			.finally(() => {
				if (!controller.signal.aborted) setVerifying(false);
			});
		return () => controller.abort();
	}, [verifying, endSession]);

	// Any 401 from the API ends the session.
	useEffect(() => {
		const onUnauthorized = () => endSession('Your session has expired. Please sign in again.');
		window.addEventListener('arc:unauthorized', onUnauthorized);
		return () => window.removeEventListener('arc:unauthorized', onUnauthorized);
	}, [endSession]);

	// Token expiry + inactivity timeout.
	useEffect(() => {
		if (!session) return undefined;

		const markActive = () => {
			lastActivity.current = Date.now();
		};
		ACTIVITY_EVENTS.forEach((event) => window.addEventListener(event, markActive, { passive: true }));

		const check = setInterval(() => {
			if (new Date(session.expiresAt) <= new Date()) {
				endSession('Your session has expired. Please sign in again.');
			} else if (Date.now() - lastActivity.current > IDLE_TIMEOUT_MS) {
				logout('You were signed out after a period of inactivity.');
			}
		}, 15_000);

		return () => {
			clearInterval(check);
			ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, markActive));
		};
	}, [session, endSession, logout]);

	const value = useMemo(
		() => ({
			user: session?.user ?? null,
			isAuthenticated: Boolean(session),
			verifying,
			notice,
			login,
			logout,
		}),
		[session, verifying, notice, login, logout],
	);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
	const context = useContext(AuthContext);
	if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
	return context;
}
