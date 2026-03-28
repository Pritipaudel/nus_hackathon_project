import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';

import { ErrorBoundary } from '@shared/components/layout';

import { HealthPage } from './HealthPage';
import { ProtectedRoute } from './ProtectedRoute';

const LoginPage = lazy(() => import('@features/auth/pages/LoginPage'));
const SignupPage = lazy(() => import('@features/auth/pages/SignupPage'));
const DashboardPage = lazy(() => import('@features/dashboard/pages/DashboardPage'));
const OnboardingPage = lazy(() => import('@features/onboarding/pages/OnboardingPage'));

const Loader = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
    <span className="spinner spinner-lg" role="status" aria-label="Loading" />
  </div>
);

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: '/health',
    element: (
      <ErrorBoundary>
        <HealthPage />
      </ErrorBoundary>
    ),
  },
  {
    path: '/login',
    element: (
      <ErrorBoundary>
        <Suspense fallback={<Loader />}>
          <LoginPage />
        </Suspense>
      </ErrorBoundary>
    ),
  },
  {
    path: '/signup',
    element: (
      <ErrorBoundary>
        <Suspense fallback={<Loader />}>
          <SignupPage />
        </Suspense>
      </ErrorBoundary>
    ),
  },
  {
    path: '/onboarding',
    element: (
      <ErrorBoundary>
        <ProtectedRoute>
          <Suspense fallback={<Loader />}>
            <OnboardingPage />
          </Suspense>
        </ProtectedRoute>
      </ErrorBoundary>
    ),
  },
  {
    path: '/dashboard',
    element: (
      <ErrorBoundary>
        <ProtectedRoute requireOnboarded>
          <Suspense fallback={<Loader />}>
            <DashboardPage />
          </Suspense>
        </ProtectedRoute>
      </ErrorBoundary>
    ),
  },
  {
    path: '*',
    element: (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '16px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>404</h1>
        <p style={{ color: '#6b7280' }}>Page not found</p>
        <a href="/" style={{ color: '#16a34a' }}>Go home</a>
      </div>
    ),
  },
]);
