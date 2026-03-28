import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { communityApi } from '../api/communityApi';

export const usePosts = (category?: string) =>
  useQuery({
    queryKey: ['community', 'posts', category],
    queryFn: () => communityApi.getPosts({ category, limit: 20 }),
  });

export const useTrending = () =>
  useQuery({
    queryKey: ['community', 'trending'],
    queryFn: communityApi.getTrending,
  });

export const useCreatePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: communityApi.createPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community', 'posts'] });
    },
  });
};

export const useReact = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, reaction_type }: { postId: string; reaction_type: 'UPVOTE' | 'DOWNVOTE' }) =>
      communityApi.react(postId, { reaction_type }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community', 'posts'] });
    },
  });
};

export const useFlag = () =>
  useMutation({
    mutationFn: ({ postId, reason }: { postId: string; reason: string }) =>
      communityApi.flag(postId, { reason }),
  });
