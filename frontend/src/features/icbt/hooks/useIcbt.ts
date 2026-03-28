import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { icbtApi } from '../api/icbtApi';

export const usePrograms = () =>
  useQuery({
    queryKey: ['icbt', 'programs'],
    queryFn: icbtApi.getPrograms,
  });

export const useMyPrograms = () =>
  useQuery({
    queryKey: ['icbt', 'my-programs'],
    queryFn: icbtApi.getMyPrograms,
  });

export const useEnroll = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (programId: string) => icbtApi.enroll({ program_id: programId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['icbt', 'my-programs'] });
    },
  });
};

export const useCompleteModule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (moduleId: string) => icbtApi.completeModule(moduleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['icbt', 'my-programs'] });
    },
  });
};
