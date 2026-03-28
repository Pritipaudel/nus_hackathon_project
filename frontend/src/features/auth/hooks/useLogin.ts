import { useMutation } from '@tanstack/react-query';

import { useAuthStore } from '@shared/stores/authStore';
import type { LoginRequest } from '@shared/types';

import { authApi } from '../api/authApi';

const resolveRedirect = (role: string, isFirstLogin: boolean): string => {
  if (role === 'USER_HEALTH_WORKER') return '/worker-dashboard';
  return isFirstLogin ? '/onboarding' : '/dashboard';
};

export const useLogin = () => {
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: (body: LoginRequest) => authApi.login(body),
    onSuccess: ({ user, tokens, is_first_login }) => {
      setAuth(user, tokens.access_token);
      setTimeout(() => {
        window.location.replace(resolveRedirect(user.role, is_first_login));
      }, 0);
    },
  });
};
