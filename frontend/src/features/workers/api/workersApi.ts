import { apiClient } from '@shared/api';
import type { HealthWorker, Meeting } from '@shared/types';

export interface ScheduleMeetingRequest {
  health_worker_id: string;
  scheduled_at: string;
}

export interface ScheduleMeetingResponse {
  meeting_id: string;
  meeting_link: string;
}

export const workersApi = {
  getHealthWorkers: async (communityId?: string): Promise<HealthWorker[]> => {
    const { data } = await apiClient.get<HealthWorker[]>('/health_workers', {
      params: communityId ? { community_id: communityId } : undefined,
    });
    return data;
  },

  getMyMeetings: async (): Promise<Meeting[]> => {
    const { data } = await apiClient.get<Meeting[]>('/meetings/my');
    return data;
  },

  scheduleMeeting: async (body: ScheduleMeetingRequest): Promise<ScheduleMeetingResponse> => {
    const { data } = await apiClient.post<ScheduleMeetingResponse>('/meetings', body);
    return data;
  },
};
