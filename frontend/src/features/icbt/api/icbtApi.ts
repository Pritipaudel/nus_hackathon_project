import { apiClient } from '@shared/api';
import type { IcbtProgram, MyIcbtProgram } from '@shared/types';

export interface EnrollIcbtRequest {
  program_id: string;
  community_id?: string;
}

export interface EnrollIcbtResponse {
  enrollment_id: string;
  status: string;
  program_id: string;
  progress_percent: number;
  community_id: string | null;
}

export interface UpdateProgressRequest {
  progress_percent: number;
}

export interface UpdateProgressResponse {
  enrollment_id: string;
  program_id: string;
  status: string;
  progress_percent: number;
  completed_at: string | null;
}

export const icbtApi = {
  getPrograms: async (): Promise<IcbtProgram[]> => {
    const { data } = await apiClient.get<IcbtProgram[]>('/icbt/programs');
    return data;
  },

  getMyPrograms: async (): Promise<MyIcbtProgram[]> => {
    const { data } = await apiClient.get<MyIcbtProgram[]>('/icbt/my-programs');
    return data;
  },

  enroll: async (body: EnrollIcbtRequest): Promise<EnrollIcbtResponse> => {
    const { data } = await apiClient.post<EnrollIcbtResponse>('/icbt/enroll', body);
    return data;
  },

  updateProgress: async (
    programId: string,
    body: UpdateProgressRequest,
  ): Promise<UpdateProgressResponse> => {
    const { data } = await apiClient.patch<UpdateProgressResponse>(
      `/icbt/programs/${programId}/progress`,
      body,
    );
    return data;
  },
};
