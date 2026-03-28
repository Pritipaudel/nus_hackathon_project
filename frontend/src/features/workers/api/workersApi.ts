import { apiClient } from '@shared/api';
import type { Certification, HealthWorker, Meeting } from '@shared/types';

export interface ScheduleMeetingRequest {
  health_worker_id: string;
  scheduled_at: string;
}

export interface ScheduleMeetingResponse {
  meeting_id: string;
  meeting_link: string;
}

export interface CreateCertificationRequest {
  title: string;
  organization: string;
  description?: string;
}

export interface AssignCertificationRequest {
  user_id: string;
  certification_id: string;
  verified?: boolean;
}

export interface AssignCertificationResponse {
  status: string;
  user_certification_id: string;
}

export interface WorkerPatient {
  user_id: string;
  first_name: string;
  last_name: string;
  anonymous_username: string;
  email: string;
}

export interface PatientProfileIcbtItem {
  program_id: string;
  title: string;
  progress_percent: number;
  status: string;
  community_name: string | null;
}

export interface PatientProfileCommunityItem {
  community_group_id: string;
  name: string;
  value: string | null;
}

export interface PatientProfileMoodSlice {
  category: string;
  count: number;
}

export interface WorkerPatientProfile {
  user_id: string;
  first_name: string;
  last_name: string;
  anonymous_username: string;
  email: string;
  icbt_programs: PatientProfileIcbtItem[];
  community_groups: PatientProfileCommunityItem[];
  mood_by_category: PatientProfileMoodSlice[];
  posts_count: number;
  overall_icbt_progress_percent: number | null;
  mood_summary: string | null;
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

  getMyWorkerMeetings: async (): Promise<Meeting[]> => {
    const { data } = await apiClient.get<Meeting[]>('/meetings/worker');
    return data;
  },

  scheduleMeeting: async (body: ScheduleMeetingRequest): Promise<ScheduleMeetingResponse> => {
    const { data } = await apiClient.post<ScheduleMeetingResponse>('/meetings', body);
    return data;
  },

  getAllCertifications: async (): Promise<Certification[]> => {
    const { data } = await apiClient.get<Certification[]>('/training/certifications');
    return data;
  },

  createCertification: async (body: CreateCertificationRequest): Promise<Certification> => {
    const { data } = await apiClient.post<Certification>('/training/certifications', body);
    return data;
  },

  assignCertification: async (body: AssignCertificationRequest): Promise<AssignCertificationResponse> => {
    const { data } = await apiClient.post<AssignCertificationResponse>('/training/certifications/assign', body);
    return data;
  },

  getMyPatients: async (): Promise<WorkerPatient[]> => {
    const { data } = await apiClient.get<WorkerPatient[]>('/training/my-patients');
    return data;
  },

  getPatientProfile: async (patientUserId: string): Promise<WorkerPatientProfile> => {
    const { data } = await apiClient.get<WorkerPatientProfile>(
      `/training/patients/${patientUserId}/profile`,
    );
    return data;
  },

  uploadWorkerPhoto: async (file: File): Promise<string> => {
    const form = new FormData();
    form.append('file', file);
    const { data } = await apiClient.post<{ status: string }>('/health_workers/me/photo', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.status; // status field holds the photo_url
  },
};
