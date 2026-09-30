import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { Skeleton } from './Skeleton.jsx';

/** Guards dashboard routes: unauthenticated users are sent to /login and returned afterwards. */
export default function ProtectedRoute() {
	const { isAuthenticated, verifying } = useAuth();
	const location = useLocation();

	if (verifying) {
		return (
			<div className="grid min-h-screen place-items-center" role="status" aria-label="Checking your session">
				<div className="w-64 space-y-3">
					<Skeleton className="h-5 w-32" />
					<Skeleton className="h-3 w-full" />
					<Skeleton className="h-3 w-2/3" />
				</div>
			</div>
		);
	}

	if (!isAuthenticated) {
		return <Navigate to="/login" replace state={{ from: location }} />;
	}

	return <Outlet />;
}
