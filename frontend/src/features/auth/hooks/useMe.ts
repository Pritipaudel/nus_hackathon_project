import { useQuery } from '@tanstack/react-query';

import { useAuthStore } from '@shared/stores/authStore';

import { authApi } from '../api/authApi';

export const ME_QUERY_KEY = ['auth', 'me'] as const;

export const useMe = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const accessToken = useAuthStore((s) => s.accessToken);
  const setAuth = useAuthStore((s) => s.setAuth);

  return useQuery({
    queryKey: ME_QUERY_KEY,
    queryFn: async () => {
      const user = await authApi.me();
      if (accessToken) setAuth(user, accessToken);
      return user;
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1_000,
    retry: false,
  });
};
