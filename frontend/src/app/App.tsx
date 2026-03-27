import { RouterProvider } from 'react-router-dom';

import { ErrorBoundary } from '@shared/components/layout';

import { QueryProvider } from './providers';
import { router } from './routes/router';

const App = () => {
  return (
    <ErrorBoundary>
      <QueryProvider>
        <RouterProvider router={router} />
      </QueryProvider>
    </ErrorBoundary>
  );
};

export default App;
