import type { HealthResponse } from '@shared/types';

import { apiClient } from './client';

export const healthApi = {
  check: async (): Promise<HealthResponse> => {
    const { data } = await apiClient.get<HealthResponse>('/health');
    return data;
  },
};
