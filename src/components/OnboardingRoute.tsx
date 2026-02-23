import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

interface OnboardingRouteProps {
    children: React.ReactNode;
}

/**
 * Inverse of ProtectedRoute:
 * - Not authenticated → /login
 * - Already onboarded → /dashboard
 * - Not onboarded → render children (the wizard)
 */
export default function OnboardingRoute({ children }: OnboardingRouteProps) {
    const { user, loading, profileLoading, isOnboarded } = useAuth();

    if (loading || profileLoading) {
        return (
            <div className="page-center">
                <span className="spinner" />
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (isOnboarded) {
        return <Navigate to="/dashboard" replace />;
    }

    return <>{children}</>;
}
