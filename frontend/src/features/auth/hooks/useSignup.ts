import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

import type { SignupRequest } from '@shared/types';

import { authApi } from '../api/authApi';

type UseSignupOptions = {
  /** Preserved through login (e.g. return to /join-group?token=… after signup + sign-in). */
  nextAfterLogin?: string | null;
};

export const useSignup = (options?: UseSignupOptions) => {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (body: SignupRequest) => authApi.signup(body),
    onSuccess: (_, variables) => {
      const params = new URLSearchParams({
        registered: 'true',
        email: variables.email,
      });
      if (options?.nextAfterLogin) {
        params.set('next', options.nextAfterLogin);
      }
      navigate(`/login?${params.toString()}`, { replace: true });
    },
  });
};
