import { useMutation } from '@tanstack/react-query';

import { useAuthStore } from '@shared/stores/authStore';
import type { LoginRequest } from '@shared/types';

import { authApi } from '../api/authApi';

export const useLogin = () => {
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: (body: LoginRequest) => authApi.login(body),
    onSuccess: ({ user, tokens, is_first_login }) => {
      setAuth(user, tokens.access_token);
      // Defer navigation so Zustand persist flushes to localStorage first
      setTimeout(() => {
        window.location.replace(is_first_login ? '/onboarding' : '/dashboard');
      }, 0);
    },
  });
};
