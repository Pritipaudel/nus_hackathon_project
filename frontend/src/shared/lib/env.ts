import { Environment } from "@shared/types/interface/environment.interface";

const required = (key: string): string => {
  const value = import.meta.env[key];
  if (value === undefined || value === '') {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value as string;
};

export const env = {
  apiBaseUrl: required('VITE_API_BASE_URL'),
  appName: required('VITE_APP_NAME'),
  appEnv: (import.meta.env['VITE_APP_ENV'] ?? 'development') as Environment,
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
} as const;
