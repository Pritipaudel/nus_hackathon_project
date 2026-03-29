import { useMutation } from '@tanstack/react-query';

import { useAuthStore } from '@shared/stores/authStore';
import type { LoginRequest } from '@shared/types';

import { authApi } from '../api/authApi';

const resolveRedirect = (role: string, isFirstLogin: boolean): string => {
  if (role === 'USER_HEALTH_WORKER') return '/worker-dashboard';
  return isFirstLogin ? '/onboarding' : '/dashboard';
};

const consumeAuthRedirectNext = (): string | null => {
  const raw = sessionStorage.getItem('authRedirectNext');
  sessionStorage.removeItem('authRedirectNext');
  return raw;
};

const toAbsoluteUrl = (pathOrUrl: string): string => {
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    return pathOrUrl;
  }
  const path = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  return `${window.location.origin}${path}`;
};

export const useLogin = () => {
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: (body: LoginRequest) => authApi.login(body),
    onSuccess: ({ user, tokens, is_first_login }) => {
      setAuth(user, tokens.access_token);
      setTimeout(() => {
        const pending = consumeAuthRedirectNext();
        if (pending) {
          window.location.replace(toAbsoluteUrl(pending));
          return;
        }
        window.location.replace(resolveRedirect(user.role, is_first_login));
      }, 0);
    },
  });
};
