export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface ApiError {
  detail: string;
  status_code?: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface IcbtProgram {
  id: string;
  title: string;
  description: string;
  difficulty_level: string;
  duration_days: number;
  url: string;
}

export interface MyProgram {
  program_id: string;
  status: 'ACTIVE' | 'COMPLETED' | 'PAUSED';
  progress_percent: number;
}

export interface CommunityPost {
  id: string;
  username: string;
  content: string;
  media_urls: string[];
  category: string;
  is_verified: boolean;
  created_at: string;
}

export interface TrendingPost {
  id: string;
  content: string;
  trend_score: number;
}

export interface HealthWorker {
  id: string;
  username: string;
  organization: string;
  is_verified: boolean;
}

export interface Meeting {
  id: string;
  scheduled_at: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
}

export interface TrainingProgram {
  id: string;
  title: string;
  organization: string;
  is_verified: boolean;
}

export interface Certification {
  program_title: string;
  issued_at: string;
  verified: boolean;
}

export interface TrendingIssue {
  category: string;
  location: string;
  report_count: number;
}

export interface OnboardingResponse {
  question_key: string;
  answer: string | string[];
}

export interface UserProfile {
  username: string;
  age: number;
  gender: string;
  location: string;
}
