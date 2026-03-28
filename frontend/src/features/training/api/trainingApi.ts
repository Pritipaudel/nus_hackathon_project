import { apiClient } from '@shared/api';
import type { TrainingProgram, UserCertification } from '@shared/types';

export interface EnrollTrainingRequest {
  program_id: string;
}

export interface EnrollTrainingResponse {
  status: string;
  enrollment_id: string;
}

export const trainingApi = {
  getPrograms: async (): Promise<TrainingProgram[]> => {
    const { data } = await apiClient.get<TrainingProgram[]>('/training/programs');
    return data;
  },

  enroll: async (body: EnrollTrainingRequest): Promise<EnrollTrainingResponse> => {
    const { data } = await apiClient.post<EnrollTrainingResponse>('/training/enroll', body);
    return data;
  },

  getMyCertifications: async (userId: string): Promise<UserCertification[]> => {
    const { data } = await apiClient.get<UserCertification[]>(
      `/training/users/${userId}/certifications`,
    );
    return data;
  },
};
