import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { trainingApi } from '../api/trainingApi';
import type { EnrollTrainingRequest } from '../api/trainingApi';

export const TRAINING_KEYS = {
  programs: ['training', 'programs'] as const,
  certifications: (userId: string) => ['training', 'certifications', userId] as const,
};

export const useTrainingPrograms = () =>
  useQuery({
    queryKey: TRAINING_KEYS.programs,
    queryFn: trainingApi.getPrograms,
  });

export const useMyTrainingCertifications = (userId: string) =>
  useQuery({
    queryKey: TRAINING_KEYS.certifications(userId),
    queryFn: () => trainingApi.getMyCertifications(userId),
    enabled: !!userId,
  });

export const useEnrollTraining = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: EnrollTrainingRequest) => trainingApi.enroll(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: TRAINING_KEYS.programs });
    },
  });
};
