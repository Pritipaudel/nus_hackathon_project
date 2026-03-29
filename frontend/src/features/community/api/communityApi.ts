import { apiClient } from '@shared/api';
import type {
  CommunityPost,
  TrendingPost,
  CommunityGroup,
  MyCommunityGroup,
} from '@shared/types';

export interface GetPostsParams {
  category?: string;
  community_group_id?: string;
  group_type?: string;
  group_value?: string;
  page?: number;
  limit?: number;
}

export interface CreatePostResponse {
  post_id: string;
}

export interface ReactRequest {
  reaction_type: 'UPVOTE' | 'HELPFUL';
}

export interface FlagRequest {
  reason: string;
}

export interface StatusResponse {
  status: string;
}

export interface CreateCommunityGroupBody {
  name: string;
  group_type: string;
  value: string;
  description?: string | null;
}

export interface CommunityInviteCreated {
  token: string;
  group_id: string;
  invited_by_user_id: string;
  expires_at: string;
  invite_path: string;
}

export interface CommunityInvitePreview {
  group_id: string;
  group_name: string;
  expires_at: string;
  invited_by_user_id: string | null;
  inviter_display_name: string | null;
}

export const communityApi = {
  getPosts: async (params?: GetPostsParams): Promise<CommunityPost[]> => {
    const { data } = await apiClient.get<CommunityPost[]>('/community/posts', { params });
    return data;
  },

  getTrending: async (limit = 10): Promise<TrendingPost[]> => {
    const { data } = await apiClient.get<TrendingPost[]>('/community/posts/trending', {
      params: { limit },
    });
    return data;
  },

  getGroups: async (): Promise<CommunityGroup[]> => {
    const { data } = await apiClient.get<CommunityGroup[]>('/community/groups');
    return data;
  },

  getMyGroups: async (): Promise<MyCommunityGroup[]> => {
    const { data } = await apiClient.get<MyCommunityGroup[]>('/community/groups/mine');
    return data;
  },

  createGroup: async (body: CreateCommunityGroupBody): Promise<CommunityGroup> => {
    const { data } = await apiClient.post<CommunityGroup>('/community/groups', body);
    return data;
  },

  joinGroup: async (groupId: string): Promise<MyCommunityGroup> => {
    const { data } = await apiClient.post<MyCommunityGroup>(`/community/groups/${groupId}/join`);
    return data;
  },

  leaveGroup: async (groupId: string): Promise<StatusResponse> => {
    const { data } = await apiClient.delete<StatusResponse>(`/community/groups/${groupId}/leave`);
    return data;
  },

  createGroupInvite: async (
    groupId: string,
    expiresInDays = 30,
  ): Promise<CommunityInviteCreated> => {
    const { data } = await apiClient.post<CommunityInviteCreated>(
      `/community/groups/${groupId}/invites`,
      {},
      { params: { expires_in_days: expiresInDays } },
    );
    return data;
  },

  getInvitePreview: async (token: string): Promise<CommunityInvitePreview> => {
    const { data } = await apiClient.get<CommunityInvitePreview>('/community/invites/preview', {
      params: { token },
    });
    return data;
  },

  acceptGroupInvite: async (token: string): Promise<MyCommunityGroup> => {
    const { data } = await apiClient.post<MyCommunityGroup>('/community/invites/accept', { token });
    return data;
  },

  createPost: async (formData: FormData): Promise<CreatePostResponse> => {
    const { data } = await apiClient.post<CreatePostResponse>('/community/posts', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  react: async (postId: string, body: ReactRequest): Promise<StatusResponse> => {
    const { data } = await apiClient.post<StatusResponse>(
      `/community/posts/${postId}/react`,
      body,
    );
    return data;
  },

  flag: async (postId: string, body: FlagRequest): Promise<StatusResponse> => {
    const { data } = await apiClient.post<StatusResponse>(
      `/community/posts/${postId}/flag`,
      body,
    );
    return data;
  },

  deletePost: async (postId: string): Promise<StatusResponse> => {
    const { data } = await apiClient.delete<StatusResponse>(`/community/posts/${postId}`);
    return data;
  },

  getUserPosts: async (userId: string): Promise<CommunityPost[]> => {
    const { data } = await apiClient.get<CommunityPost[]>(`/community/users/${userId}/posts`);
    return data;
  },
};
