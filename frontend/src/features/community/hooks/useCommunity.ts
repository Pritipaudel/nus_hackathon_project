import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { communityApi } from '../api/communityApi';
import type { GetPostsParams, ReactRequest, FlagRequest } from '../api/communityApi';

export const COMMUNITY_KEYS = {
  posts: (params?: GetPostsParams) => ['community', 'posts', params] as const,
  trending: ['community', 'trending'] as const,
  groups: ['community', 'groups'] as const,
  userPosts: (userId: string) => ['community', 'user-posts', userId] as const,
};

export const useCommunityPosts = (params?: GetPostsParams) =>
  useQuery({
    queryKey: COMMUNITY_KEYS.posts(params),
    queryFn: () => communityApi.getPosts(params),
  });

export const useTrendingPosts = () =>
  useQuery({
    queryKey: COMMUNITY_KEYS.trending,
    queryFn: () => communityApi.getTrending(10),
  });

export const useCommunityGroups = () =>
  useQuery({
    queryKey: COMMUNITY_KEYS.groups,
    queryFn: communityApi.getGroups,
  });

export const useCreatePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) => communityApi.createPost(formData),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['community', 'posts'] });
      void queryClient.invalidateQueries({ queryKey: COMMUNITY_KEYS.trending });
    },
  });
};

export const useReactToPost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, body }: { postId: string; body: ReactRequest }) =>
      communityApi.react(postId, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['community', 'posts'] });
    },
  });
};

export const useFlagPost = () =>
  useMutation({
    mutationFn: ({ postId, body }: { postId: string; body: FlagRequest }) =>
      communityApi.flag(postId, body),
  });

export const useUserPosts = (userId: string) =>
  useQuery({
    queryKey: COMMUNITY_KEYS.userPosts(userId),
    queryFn: () => communityApi.getUserPosts(userId),
    enabled: !!userId,
  });
