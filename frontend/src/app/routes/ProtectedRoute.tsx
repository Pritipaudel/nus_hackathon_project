import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import { useAuthStore } from '@shared/stores/authStore';

interface ProtectedRouteProps {
  children: ReactNode;
  requireOnboarded?: boolean;
}

export const ProtectedRoute = ({ children, requireOnboarded = false }: ProtectedRouteProps) => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireOnboarded && user?.is_onboarded === false) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
};
