export interface ApiError {
  detail: string;
  status_code?: number;
}

export interface CommunityMetadata {
  community_id: string;
  community_name: string;
  community_group_type: string;
  total_users_using: number;
  total_users_completed: number;
  total_users_in_progress: number;
}

export interface IcbtProgram {
  id: string;
  title: string;
  description: string | null;
  difficulty_level: string | null;
  duration_days: number | null;
  url: string | null;
  community_metadata: CommunityMetadata[];
}

export interface MyIcbtProgram {
  enrollment_id: string;
  program_id: string;
  title: string;
  description: string | null;
  difficulty_level: string | null;
  duration_days: number | null;
  url: string | null;
  status: 'ACTIVE' | 'COMPLETED';
  progress_percent: number;
  community_id: string | null;
  community_name: string | null;
  started_at: string;
  last_activity_at: string;
  completed_at: string | null;
}

export interface PostMedia {
  url: string;
  media_type: string;
}

export interface CommunityGroup {
  id: string;
  name: string;
  group_type: string;
  value: string;
  description: string | null;
  created_by_user_id: string | null;
  created_at: string;
  member_count?: number;
}

export interface MyCommunityGroup extends CommunityGroup {
  is_creator: boolean;
  joined_at: string;
}

export interface CommunityPost {
  id: string;
  user_id: string;
  username: string;
  content: string;
  category: string;
  community_group: CommunityGroup | null;
  is_verified: boolean;
  created_at: string;
  media_urls: PostMedia[];
  reaction_count: number;
  flag_count: number;
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
  title: string | null;
  bio: string | null;
  specialties: string[];
  languages: string[];
  availability: string;
  sessions_count: number;
  photo_url: string | null;
  community_id: string | null;
  community_name: string | null;
  is_verified: boolean;
}

export interface Meeting {
  id: string;
  user_id: string;
  health_worker_id: string;
  scheduled_at: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  meeting_link: string;
}

export interface TrainingProgram {
  id: string;
  title: string;
  organization: string;
  description: string | null;
  is_verified: boolean;
}

export interface Certification {
  id: string;
  title: string;
  organization: string;
  description: string | null;
}

export interface UserCertification {
  id: string;
  user_id: string;
  certification_id: string;
  issued_at: string;
  verified: boolean;
  certification: Certification;
}
