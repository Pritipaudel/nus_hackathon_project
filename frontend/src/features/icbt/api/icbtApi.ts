import { apiClient } from '@shared/api';
import type { IcbtProgram, MyProgram } from '@shared/types';

interface EnrollRequest {
  program_id: string;
}

interface EnrollResponse {
  enrollment_id: string;
  status: string;
}

interface CompleteModuleResponse {
  status: string;
}

export const icbtApi = {
  getPrograms: async (): Promise<IcbtProgram[]> => {
    const { data } = await apiClient.get<IcbtProgram[]>('/icbt/programs');
    return data;
  },

  enroll: async (body: EnrollRequest): Promise<EnrollResponse> => {
    const { data } = await apiClient.post<EnrollResponse>('/icbt/enroll', body);
    return data;
  },

  getMyPrograms: async (): Promise<MyProgram[]> => {
    const { data } = await apiClient.get<MyProgram[]>('/icbt/my-programs');
    return data;
  },

  completeModule: async (moduleId: string): Promise<CompleteModuleResponse> => {
    const { data } = await apiClient.post<CompleteModuleResponse>(
      `/icbt/modules/${moduleId}/complete`,
    );
    return data;
  },
};
