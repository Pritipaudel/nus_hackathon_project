import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuthStore } from '@shared/stores/authStore';

import { communityApi } from '../api/communityApi';
import type {
  CreateCommunityGroupBody,
  GetPostsParams,
  ReactRequest,
  FlagRequest,
} from '../api/communityApi';

export const COMMUNITY_KEYS = {
  posts: (params?: GetPostsParams) => ['community', 'posts', params] as const,
  trending: ['community', 'trending'] as const,
  groups: ['community', 'groups'] as const,
  myGroups: ['community', 'groups', 'mine'] as const,
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

export const useMyCommunityGroups = () => {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: COMMUNITY_KEYS.myGroups,
    queryFn: communityApi.getMyGroups,
    enabled: Boolean(user),
  });
};

export const useCreateCommunityGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateCommunityGroupBody) => communityApi.createGroup(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: COMMUNITY_KEYS.groups });
      void queryClient.invalidateQueries({ queryKey: COMMUNITY_KEYS.myGroups });
    },
  });
};

export const useJoinCommunityGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (groupId: string) => communityApi.joinGroup(groupId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: COMMUNITY_KEYS.groups });
      void queryClient.invalidateQueries({ queryKey: COMMUNITY_KEYS.myGroups });
    },
  });
};

export const useLeaveCommunityGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (groupId: string) => communityApi.leaveGroup(groupId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: COMMUNITY_KEYS.groups });
      void queryClient.invalidateQueries({ queryKey: COMMUNITY_KEYS.myGroups });
    },
  });
};

export const useCommunityInvitePreview = (token: string) =>
  useQuery({
    queryKey: ['community', 'invite-preview', token] as const,
    queryFn: () => communityApi.getInvitePreview(token),
    enabled: token.length >= 8,
  });

export const useCreateGroupInvite = () =>
  useMutation({
    mutationFn: ({ groupId, expiresInDays }: { groupId: string; expiresInDays?: number }) =>
      communityApi.createGroupInvite(groupId, expiresInDays),
  });

export const useAcceptGroupInvite = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (inviteToken: string) => communityApi.acceptGroupInvite(inviteToken),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: COMMUNITY_KEYS.groups });
      void queryClient.invalidateQueries({ queryKey: COMMUNITY_KEYS.myGroups });
      void queryClient.invalidateQueries({ queryKey: ['community', 'posts'] });
    },
  });
};

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
