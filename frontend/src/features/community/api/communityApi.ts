import { apiClient } from '@shared/api';
import type { CommunityPost, TrendingPost, CommunityGroup } from '@shared/types';

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
