import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { chatQueryKeys } from '@features/chat/hooks/useDirectChat';
import { workersApi } from '../api/workersApi';
import type { AssignCertificationRequest, CreateCertificationRequest, ScheduleMeetingRequest } from '../api/workersApi';

export const WORKERS_KEYS = {
  workers: (communityId?: string) => ['workers', communityId] as const,
  myMeetings: ['workers', 'meetings', 'my'] as const,
  myWorkerMeetings: ['workers', 'meetings', 'worker'] as const,
  allCertifications: ['workers', 'certifications', 'all'] as const,
  myPatients: ['workers', 'patients', 'my'] as const,
  patientProfile: (patientId: string) => ['workers', 'patients', 'profile', patientId] as const,
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

export const useMyWorkerMeetings = () =>
  useQuery({
    queryKey: WORKERS_KEYS.myWorkerMeetings,
    queryFn: workersApi.getMyWorkerMeetings,
  });

export const useScheduleMeeting = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: ScheduleMeetingRequest) => workersApi.scheduleMeeting(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: WORKERS_KEYS.myMeetings });
      void queryClient.invalidateQueries({ queryKey: chatQueryKeys.contacts() });
      void queryClient.invalidateQueries({ queryKey: ['dashboard', 'me'] });
      void queryClient.invalidateQueries({ queryKey: WORKERS_KEYS.myPatients });
      void queryClient.invalidateQueries({ queryKey: WORKERS_KEYS.myWorkerMeetings });
    },
  });
};

export const useAllCertifications = () =>
  useQuery({
    queryKey: WORKERS_KEYS.allCertifications,
    queryFn: workersApi.getAllCertifications,
  });

export const useMyPatients = () =>
  useQuery({
    queryKey: WORKERS_KEYS.myPatients,
    queryFn: workersApi.getMyPatients,
  });

export const useWorkerPatientProfile = (patientUserId: string | null) =>
  useQuery({
    queryKey: patientUserId
      ? WORKERS_KEYS.patientProfile(patientUserId)
      : (['workers', 'patients', 'profile', 'none'] as const),
    queryFn: () => workersApi.getPatientProfile(patientUserId!),
    enabled: Boolean(patientUserId),
  });

export const useCreateCertification = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateCertificationRequest) => workersApi.createCertification(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: WORKERS_KEYS.allCertifications });
    },
  });
};

export const useAssignCertification = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: AssignCertificationRequest) => workersApi.assignCertification(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: WORKERS_KEYS.allCertifications });
    },
  });
};

export const useUploadWorkerPhoto = () =>
  useMutation({
    mutationFn: (file: File) => workersApi.uploadWorkerPhoto(file),
  });
