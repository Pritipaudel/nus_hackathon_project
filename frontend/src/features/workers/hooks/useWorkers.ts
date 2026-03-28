import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { workersApi } from '../api/workersApi';
import type { ScheduleMeetingRequest } from '../api/workersApi';

export const WORKERS_KEYS = {
  workers: (communityId?: string) => ['workers', communityId] as const,
  myMeetings: ['workers', 'meetings', 'my'] as const,
};

export const useHealthWorkers = (communityId?: string) =>
  useQuery({
    queryKey: WORKERS_KEYS.workers(communityId),
    queryFn: () => workersApi.getHealthWorkers(communityId),
  });

export const useMyMeetings = () =>
  useQuery({
    queryKey: WORKERS_KEYS.myMeetings,
    queryFn: workersApi.getMyMeetings,
  });

export const useScheduleMeeting = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: ScheduleMeetingRequest) => workersApi.scheduleMeeting(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: WORKERS_KEYS.myMeetings });
    },
  });
};
