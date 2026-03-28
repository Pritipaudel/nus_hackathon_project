import axios from 'axios';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';

import { env } from '@shared/lib/env';

export const apiClient = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Read directly from localStorage — Zustand persist writes synchronously
    const raw = localStorage.getItem('auth-storage');
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as { state?: { accessToken?: string } };
        const token = parsed?.state?.accessToken;
        if (token) {
          config.headers.set('Authorization', `Bearer ${token}`);
        }
      } catch {
        // malformed — skip
      }
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth-storage');
      window.location.replace('/login');
    }
    return Promise.reject(error);
  },
);
