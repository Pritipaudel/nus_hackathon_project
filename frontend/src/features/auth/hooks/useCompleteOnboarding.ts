import { useMutation } from '@tanstack/react-query';

import { useAuthStore } from '@shared/stores/authStore';

import { authApi } from '../api/authApi';

export const useCompleteOnboarding = () => {
  const setAuth = useAuthStore((s) => s.setAuth);
  const accessToken = useAuthStore((s) => s.accessToken);

  return useMutation({
    mutationFn: () => authApi.completeOnboarding(),
    onSuccess: (updatedUser) => {
      if (accessToken) {
        setAuth(updatedUser, accessToken);
      }
      // Use replace so the store is fully written to localStorage before navigation
      setTimeout(() => {
        window.location.replace('/dashboard?fromOnboarding=1');
      }, 0);
    },
  });
};
