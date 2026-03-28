import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { icbtApi } from '../api/icbtApi';
import type { EnrollIcbtRequest, UpdateProgressRequest } from '../api/icbtApi';

export const ICBT_KEYS = {
  programs: ['icbt', 'programs'] as const,
  myPrograms: ['icbt', 'my-programs'] as const,
};

export const useIcbtPrograms = () =>
  useQuery({
    queryKey: ICBT_KEYS.programs,
    queryFn: icbtApi.getPrograms,
  });

export const useMyIcbtPrograms = () =>
  useQuery({
    queryKey: ICBT_KEYS.myPrograms,
    queryFn: icbtApi.getMyPrograms,
  });

export const useEnrollIcbt = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: EnrollIcbtRequest) => icbtApi.enroll(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ICBT_KEYS.myPrograms });
    },
  });
};

export const useUpdateIcbtProgress = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ programId, body }: { programId: string; body: UpdateProgressRequest }) =>
      icbtApi.updateProgress(programId, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ICBT_KEYS.myPrograms });
    },
  });
};
