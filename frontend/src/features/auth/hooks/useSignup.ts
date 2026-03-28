import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

import type { SignupRequest } from '@shared/types';

import { authApi } from '../api/authApi';

export const useSignup = () => {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (body: SignupRequest) => authApi.signup(body),
    onSuccess: (_, variables) => {
      navigate(`/login?registered=true&email=${encodeURIComponent(variables.email)}`, {
        replace: true,
      });
    },
  });
};
