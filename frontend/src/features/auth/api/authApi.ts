import { apiClient } from '@shared/api';
import type { AuthResponse, LoginRequest, SignupRequest, User } from '@shared/types';

export const authApi = {
  login: async (body: LoginRequest): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>('/auth/login', body);
    return data;
  },

  signup: async (body: SignupRequest): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>('/auth/signup', body);
    return data;
  },

  me: async (): Promise<User> => {
    const { data } = await apiClient.get<User>('/auth/me');
    return data;
  },

  completeOnboarding: async (): Promise<User> => {
    const { data } = await apiClient.patch<User>('/auth/onboarding/complete');
    return data;
  },
};
