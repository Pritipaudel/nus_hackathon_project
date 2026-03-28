import { useQuery } from '@tanstack/react-query';
import { getMyDashboard, getWorkerDashboardStats } from '../api/dashboardApi';

export const useMyDashboard = () =>
  useQuery({
    queryKey: ['dashboard', 'me'],
    queryFn: getMyDashboard,
    staleTime: 30_000,
  });

export const useWorkerDashboardStats = () =>
  useQuery({
    queryKey: ['dashboard', 'worker-stats'],
    queryFn: getWorkerDashboardStats,
    staleTime: 30_000,
  });
