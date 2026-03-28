import { apiClient } from '@shared/api/client';

export interface DashboardProgram {
  program_id: string;
  title: string;
  difficulty_level: string | null;
  duration_days: number | null;
  status: string;
  progress_percent: number;
  started_at: string;
  completed_at: string | null;
}

export interface DashboardMeeting {
  id: string;
  health_worker_id: string;
  worker_name: string | null;
  scheduled_at: string;
  status: string;
  meeting_link: string;
}

export interface DashboardCertification {
  id: string;
  title: string;
  organization: string;
  issued_at: string;
  verified: boolean;
}

export interface DashboardData {
  overall_progress: number;
  programmes_enrolled: number;
  programmes_completed: number;
  upcoming_meetings_count: number;
  certifications_count: number;
  active_programmes: DashboardProgram[];
  completed_programmes: DashboardProgram[];
  upcoming_meetings: DashboardMeeting[];
  latest_certification: DashboardCertification | null;
}

export const getMyDashboard = async (): Promise<DashboardData> => {
  const { data } = await apiClient.get<DashboardData>('/auth/me/dashboard');
  return data;
};

export interface WorkerDashboardStats {
  total_health_workers: number;
  upcoming_meetings_count: number;
  total_community_posts: number;
}

export const getWorkerDashboardStats = async (): Promise<WorkerDashboardStats> => {
  const { data } = await apiClient.get<WorkerDashboardStats>('/auth/me/worker-dashboard');
  return data;
};
