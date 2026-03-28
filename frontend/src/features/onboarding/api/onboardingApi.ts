import { apiClient } from '@shared/api';
import type { OnboardingResponse } from '@shared/types';

interface SubmitOnboardingRequest {
  responses: OnboardingResponse[];
}

interface SubmitOnboardingResult {
  status: string;
}

export const onboardingApi = {
  submit: async (body: SubmitOnboardingRequest): Promise<SubmitOnboardingResult> => {
    const { data } = await apiClient.post<SubmitOnboardingResult>('/users/onboarding', body);
    return data;
  },
};
