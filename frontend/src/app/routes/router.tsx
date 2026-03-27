import { createBrowserRouter } from 'react-router-dom';

import { ErrorBoundary } from '@shared/components/layout';

import { HealthPage } from './HealthPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <ErrorBoundary>
        <HealthPage />
      </ErrorBoundary>
    ),
  },
]);
