import { useMutation } from '@tanstack/react-query';

import type { OnboardingResponse } from '@shared/types';

import { onboardingApi } from '../api/onboardingApi';

export const useSubmitOnboarding = () =>
  useMutation({
    mutationFn: (responses: OnboardingResponse[]) =>
      onboardingApi.submit({ responses }),
  });
