import { lazy, Suspense } from 'react';
import { BrowserRouter, Link, Outlet, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import Login from './components/auth/Login.jsx';
import AppLayout from './components/common/AppLayout.jsx';
import ErrorBoundary from './components/common/ErrorBoundary.jsx';
import ProtectedRoute from './components/common/ProtectedRoute.jsx';
import { CardSkeleton, Skeleton } from './components/common/Skeleton.jsx';

// Pages are code-split so the login screen loads without charts and maps.
const Dashboard = lazy(() => import('./components/dashboard/Dashboard.jsx'));
const MonitoringPage = lazy(() => import('./components/monitoring/MonitoringPage.jsx'));
const CollisionAlertsPage = lazy(() => import('./components/monitoring/CollisionAlertsPage.jsx'));
const RentalDetails = lazy(() => import('./components/rentals/RentalDetails.jsx'));
const RentalList = lazy(() => import('./components/rentals/RentalList.jsx'));
const RentalMonitoring = lazy(() => import('./components/rentals/RentalMonitoring.jsx'));
const VehicleDetails = lazy(() => import('./components/vehicles/VehicleDetails.jsx'));
const VehicleList = lazy(() => import('./components/vehicles/VehicleList.jsx'));
const AvailabilityCalendar = lazy(() => import('./components/vehicles/AvailabilityCalendar.jsx'));
const VehicleHealth = lazy(() => import('./components/vehicles/VehicleHealth.jsx'));
const BookingList = lazy(() => import('./components/bookings/BookingList.jsx'));
const PaymentVerificationList = lazy(() => import('./components/payments/PaymentVerificationList.jsx'));
const RentalExtensionList = lazy(() => import('./components/extensions/RentalExtensionList.jsx'));
const AlertCenter = lazy(() => import('./components/alerts/AlertCenter.jsx'));
const CustomerList = lazy(() => import('./components/customers/CustomerList.jsx'));
const CustomerDetails = lazy(() => import('./components/customers/CustomerDetails.jsx'));
const TrustScoreboard = lazy(() => import('./components/customers/TrustScoreboard.jsx'));

function PageFallback() {
	return (
		<div className="space-y-4" role="status" aria-label="Loading page">
			<Skeleton className="h-3 w-40" />
			<Skeleton className="h-9 w-72" />
			<div className="grid grid-cols-2 gap-3.5 md:grid-cols-4">
				<CardSkeleton />
				<CardSkeleton />
				<CardSkeleton />
				<CardSkeleton />
			</div>
		</div>
	);
}

function LazyPages() {
	return (
		<Suspense fallback={<PageFallback />}>
			<Outlet />
		</Suspense>
	);
}

export default function App() {
	return (
		<ErrorBoundary>
			<ThemeProvider>
				<AuthProvider>
					<BrowserRouter>
						<Routes>
							<Route path="/login" element={<Login />} />

							<Route element={<ProtectedRoute />}>
								<Route element={<AppLayout />}>
									<Route element={<LazyPages />}>
										<Route index element={<Dashboard />} />

										{/* Operations */}
										<Route path="bookings" element={<BookingList />} />
										<Route path="payment-verifications" element={<PaymentVerificationList />} />
										<Route path="rental-extensions" element={<RentalExtensionList />} />
										<Route path="rental-monitoring" element={<RentalMonitoring />} />

										{/* Fleet */}
										<Route path="vehicles" element={<VehicleList />} />
										<Route path="vehicles/:id" element={<VehicleDetails />} />
										<Route path="availability-calendar" element={<AvailabilityCalendar />} />
										<Route path="vehicle-health" element={<VehicleHealth />} />

										{/* Rentals (reachable from Bookings / Payment / Extensions / Customers) */}
										<Route path="rentals" element={<RentalList />} />
										<Route path="rentals/:id" element={<RentalDetails />} />

										{/* IoT & Alerts */}
										<Route path="monitoring" element={<MonitoringPage />} />
										<Route path="collisions" element={<CollisionAlertsPage />} />
										<Route path="alerts" element={<AlertCenter />} />

										{/* Customers */}
										<Route path="customers" element={<CustomerList />} />
										<Route path="customers/:id" element={<CustomerDetails />} />
										<Route path="trust-scoreboard" element={<TrustScoreboard />} />

										<Route path="*" element={<NotFound />} />
									</Route>
								</Route>
							</Route>
						</Routes>
					</BrowserRouter>
				</AuthProvider>
			</ThemeProvider>
		</ErrorBoundary>
	);
}

function NotFound() {
	return (
		<div className="card mx-auto max-w-md p-10 text-center">
			<p className="eyebrow">404</p>
			<h1 className="mt-2 text-2xl font-extrabold">Page not found</h1>
			<Link to="/" className="btn btn-primary mt-6">
				Back to dashboard
			</Link>
		</div>
	);
}
