import { useState } from 'react';
import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import { env } from '@shared/lib/env';

interface QueryProviderProps {
  children: ReactNode;
}

const makeQueryClient = (): QueryClient =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        retry: (failureCount, error) => {
          if (error instanceof Error && 'status' in error) {
            const status = (error as Error & { status: number }).status;
            if (status === 401 || status === 403 || status === 404) return false;
          }
          return failureCount < 3;
        },
        refetchOnWindowFocus: env.isProd,
      },
      mutations: {
        retry: false,
      },
    },
  });

export const QueryProvider = ({ children }: QueryProviderProps) => {
  const [queryClient] = useState(() => makeQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {env.isDev && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
};
