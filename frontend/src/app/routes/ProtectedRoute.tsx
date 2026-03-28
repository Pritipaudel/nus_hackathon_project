import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import { useAuthStore } from '@shared/stores/authStore';
import type { UserRole } from '@shared/types';

interface ProtectedRouteProps {
  children: ReactNode;
  requireOnboarded?: boolean;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute = ({
  children,
  requireOnboarded = false,
  allowedRoles,
}: ProtectedRouteProps) => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && user?.role && !allowedRoles.includes(user.role)) {
    const fallback = user.role === 'USER_HEALTH_WORKER' ? '/worker-dashboard' : '/dashboard';
    return <Navigate to={fallback} replace />;
  }

  if (requireOnboarded && user?.is_onboarded === false) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
};
