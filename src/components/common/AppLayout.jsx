import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import {
	AlertTriangle,
	Bell,
	Car,
	CalendarCheck,
	CalendarClock,
	CalendarRange,
	CreditCard,
	Eye,
	HeartPulse,
	Home,
	LogOut,
	Menu,
	Moon,
	PanelLeftClose,
	PanelLeftOpen,
	ShieldCheck,
	Sun,
	Users,
	Wifi,
	X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';
import { api } from '../../services/api.js';
import { useApi } from '../../hooks/useApi.js';
import ErrorBoundary from './ErrorBoundary.jsx';

const NAV = [
	{ group: 'Operations', items: [
		{ to: '/', label: 'Dashboard', icon: Home, end: true },
		{ to: '/bookings', label: 'Bookings', icon: CalendarCheck, badgeKey: 'pending_bookings' },
		{ to: '/payment-verifications', label: 'Payment Verification', icon: CreditCard, badgeKey: 'pending_payment_verifications' },
		{ to: '/rental-extensions', label: 'Rental Extensions', icon: CalendarClock, badgeKey: 'pending_rental_extensions' },
		{ to: '/rental-monitoring', label: 'Rental Monitoring', icon: Eye },
	] },
	{ group: 'Fleet', items: [
		{ to: '/vehicles', label: 'Vehicles', icon: Car },
		{ to: '/availability-calendar', label: 'Availability Calendar', icon: CalendarRange },
		{ to: '/vehicle-health', label: 'Vehicle Health', icon: HeartPulse },
	] },
	{ group: 'IoT & Alerts', items: [
		{ to: '/monitoring', label: 'IoT Monitoring', icon: Wifi },
		{ to: '/collisions', label: 'Collision Alerts', icon: AlertTriangle, badgeKey: 'open_collisions' },
		{ to: '/alerts', label: 'Alert Center', icon: Bell, badgeKey: 'alerts_total' },
	] },
	{ group: 'Customers', items: [
		{ to: '/customers', label: 'Customers', icon: Users },
		{ to: '/trust-scoreboard', label: 'Trust Scoreboard', icon: ShieldCheck, badgeKey: 'at_risk_customers' },
	] },
];

const TITLES = {
	'': 'Dashboard',
	bookings: 'Bookings',
	'payment-verifications': 'Payment Verification',
	'rental-extensions': 'Rental Extensions',
	'rental-monitoring': 'Rental Monitoring',
	vehicles: 'Vehicles',
	'availability-calendar': 'Availability Calendar',
	'vehicle-health': 'Vehicle Health',
	rentals: 'Rentals',
	monitoring: 'IoT Monitoring',
	collisions: 'Collision Alerts',
	alerts: 'Alert Center',
	customers: 'Customers',
	'trust-scoreboard': 'Trust Scoreboard',
};

const initials = (name = '') => name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase();

export default function AppLayout() {
	const { user, logout } = useAuth();
	const { theme, toggleTheme } = useTheme();
	const location = useLocation();
	const [mobileOpen, setMobileOpen] = useState(false);
	const [collapsed, setCollapsed] = useState(false);

	// Sidebar badge counts and the header bell, refreshed every minute.
	const { data: stats } = useApi((signal) => api.dashboard.stats({}, { signal }), [], { interval: 60_000 });
	const openAlerts = stats?.data?.alerts_total ?? 0;

	useEffect(() => setMobileOpen(false), [location.pathname]);

	const section = location.pathname.split('/')[1] ?? '';
	const title = TITLES[section] ?? 'ARC Operations';

	return (
		<div className="flex min-h-screen bg-bg">
			<a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:bg-surface focus:p-2">
				Skip to content
			</a>

			{mobileOpen && <button type="button" aria-label="Close menu" className="fixed inset-0 z-30 bg-[#071a20aa] md:hidden" onClick={() => setMobileOpen(false)} />}

			<aside
				className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-line bg-surface px-3.5 py-6 transition-all duration-200 md:sticky md:top-0 md:h-screen md:translate-x-0 ${
					mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
				} ${collapsed ? 'w-[72px]' : 'w-64'}`}
				aria-label="Main navigation"
			>
				<div className={`flex items-start pb-6 ${collapsed ? 'justify-center' : 'justify-between px-2.5'}`}>
					{!collapsed && (
						<div className="leading-none">
							<strong className="block text-lg font-extrabold tracking-[0.08em] italic">ARC RIDE</strong>
							<span className="mt-1.5 block font-mono text-[8px] font-medium tracking-[0.28em] text-cyan">DAVAO RENT A CAR</span>
						</div>
					)}
					<button
						type="button"
						onClick={() => setCollapsed((c) => !c)}
						className="hidden size-8 place-items-center rounded-md text-muted hover:bg-soft md:grid"
						aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
						title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
					>
						{collapsed ? <PanelLeftOpen className="size-[18px]" /> : <PanelLeftClose className="size-[18px]" />}
					</button>
					<button type="button" onClick={() => setMobileOpen(false)} className="grid size-8 place-items-center text-muted md:hidden" aria-label="Close menu">
						<X className="size-5" />
					</button>
				</div>

				<nav className="flex-1 overflow-y-auto">
					{NAV.map(({ group, items }) => (
						<div key={group} className="mb-2">
							{!collapsed && <p className="mx-2.5 mt-4 mb-2 text-xs font-black tracking-wide uppercase">{group}</p>}
							{items.map(({ to, label, icon: Icon, end, badgeKey }) => {
								const badgeValue = badgeKey ? (stats?.data?.[badgeKey] ?? 0) : 0;
								return (
									<NavLink
										key={to}
										to={to}
										end={end}
										title={collapsed ? label : undefined}
										className={({ isActive }) =>
											`mb-0.5 flex items-center gap-2.5 rounded-md px-2.5 py-2.5 text-[13px] font-bold transition-colors ${
												collapsed ? 'justify-center' : ''
											} ${isActive ? 'bg-soft text-accent-strong' : 'text-muted hover:bg-soft hover:text-accent-strong'}`
										}
									>
										<Icon className="size-[17px] shrink-0" aria-hidden="true" />
										{!collapsed && <span className="flex-1">{label}</span>}
										{!collapsed && badgeValue > 0 && (
											<b className="rounded-full bg-danger-soft px-1.5 py-0.5 font-mono text-[10px] text-danger" aria-label={`${badgeValue} ${label.toLowerCase()}`}>
												{badgeValue}
											</b>
										)}
									</NavLink>
								);
							})}
						</div>
					))}
				</nav>

				{!collapsed && (
					<div className="mx-0.5 mb-2 flex items-center gap-2.5 rounded-lg bg-navy p-2.5 text-white">
						<span className="grid size-8 shrink-0 place-items-center rounded-full bg-white text-[10px] font-extrabold text-navy">{initials(user?.name)}</span>
						<div className="min-w-0">
							<strong className="block truncate text-xs">{user?.name}</strong>
							<small className="block text-[10px] text-[#c9d3ef] capitalize">{user?.role} account</small>
						</div>
					</div>
				)}
				<button
					type="button"
					onClick={() => logout()}
					className={`flex items-center gap-2.5 rounded-md px-2.5 py-2.5 text-[13px] font-bold text-muted hover:bg-danger-soft hover:text-danger ${collapsed ? 'justify-center' : ''}`}
					title="Sign out"
				>
					<LogOut className="size-[17px]" aria-hidden="true" />
					{!collapsed && 'Sign out'}
				</button>
			</aside>

			<div className="flex min-w-0 flex-1 flex-col">
				<header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-line bg-surface px-4 text-[13px] md:px-9">
					<button type="button" onClick={() => setMobileOpen(true)} className="grid size-9 place-items-center rounded-md md:hidden" aria-label="Open menu">
						<Menu className="size-5" />
					</button>
					<p className="truncate text-muted">
						<span className="hidden sm:inline">ARC Operations / </span>
						<strong className="text-ink">{title}</strong>
					</p>
					<div className="ml-auto flex items-center gap-1.5">
						<button type="button" onClick={toggleTheme} className="grid size-9 place-items-center rounded-md text-muted hover:bg-soft" aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>
							{theme === 'light' ? <Moon className="size-[18px]" /> : <Sun className="size-[18px]" />}
						</button>
						<Link to="/alerts" className="relative grid size-9 place-items-center rounded-md text-muted hover:bg-soft" aria-label={`${openAlerts} open alerts`}>
							<Bell className="size-[18px]" />
							{openAlerts > 0 && <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-danger ring-2 ring-surface" />}
						</Link>
						<span className="ml-1 grid size-8 place-items-center rounded-full bg-ink text-[10px] font-extrabold text-surface" title={user?.email}>
							{initials(user?.name)}
						</span>
					</div>
				</header>

				<main id="main" className="mx-auto w-full max-w-[1500px] flex-1 px-4 py-6 md:px-9 md:py-9">
					<ErrorBoundary resetKey={location.pathname}>
						<Outlet />
					</ErrorBoundary>
				</main>
			</div>
		</div>
	);
}

export function PageHeader({ eyebrow, title, description, actions }) {
	return (
		<div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
			<div>
				{eyebrow && <p className="eyebrow">{eyebrow}</p>}
				<h1 className="mt-2.5 text-[28px] leading-tight font-extrabold tracking-[-0.05em] md:text-[31px]">{title}</h1>
				{description && <p className="mt-1.5 text-[13px] text-muted">{description}</p>}
			</div>
			{actions}
		</div>
	);
}
