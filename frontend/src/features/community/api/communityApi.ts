import { apiClient } from '@shared/api';
import type { CommunityPost, TrendingPost } from '@shared/types';

interface CreatePostRequest {
  content: string;
  category: string;
  media_urls: string[];
}

interface CreatePostResponse {
  post_id: string;
}

interface ReactRequest {
  reaction_type: 'UPVOTE' | 'DOWNVOTE';
}

interface FlagRequest {
  reason: string;
}

interface StatusResponse {
  status: string;
}

interface GetPostsParams {
  category?: string;
  page?: number;
  limit?: number;
}

interface UploadUrlRequest {
  file_name: string;
  content_type: string;
}

interface UploadUrlResponse {
  upload_url: string;
  file_url: string;
}

export const communityApi = {
  getPosts: async (params?: GetPostsParams): Promise<CommunityPost[]> => {
    const { data } = await apiClient.get<CommunityPost[]>('/community/posts', { params });
    return data;
  },

  getTrending: async (): Promise<TrendingPost[]> => {
    const { data } = await apiClient.get<TrendingPost[]>('/community/posts/trending');
    return data;
  },

  createPost: async (body: CreatePostRequest): Promise<CreatePostResponse> => {
    const { data } = await apiClient.post<CreatePostResponse>('/community/posts', body);
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

  getUploadUrl: async (body: UploadUrlRequest): Promise<UploadUrlResponse> => {
    const { data } = await apiClient.post<UploadUrlResponse>('/media/upload-url', body);
    return data;
  },
};
