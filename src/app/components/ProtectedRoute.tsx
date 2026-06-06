import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../utils/roleUtils';

interface ProtectedRouteProps {
    children: React.ReactNode;
    /** If provided, only these roles can access the route */
    allowedRoles?: UserRole[];
}

/**
 * ProtectedRoute — wraps any page that requires authentication.
 * Redirects unauthenticated users to /login with a `from` state so
 * we can send them back after login. Optionally enforces role access.
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
    const { isAuthenticated, isLoading, user } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-950">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">
                        Tekshirilmoqda...
                    </p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-950">
                <div className="text-center space-y-4">
                    <div className="text-6xl">🔒</div>
                    <h1 className="text-2xl font-black text-white uppercase tracking-widest">
                        Ruxsat Yo'q
                    </h1>
                    <p className="text-slate-400 text-sm">
                        Bu sahifaga kirish uchun sizning rolizingiz yetarli emas.
                    </p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
};
