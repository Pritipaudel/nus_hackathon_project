import type { EnvConfig, Environment } from '@shared/types';

const required = (key: string): string => {
  const value = import.meta.env[key];
  if (value === undefined || value === '') {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value as string;
};

const rawAppName = (import.meta.env['VITE_APP_NAME'] as string | undefined)?.trim();

export const env: EnvConfig = {
  apiBaseUrl: required('VITE_API_BASE_URL'),
  appName: rawAppName && rawAppName !== '' ? rawAppName : 'उत्थान',
  appEnv: (import.meta.env['VITE_APP_ENV'] ?? 'development') as Environment,
  isDev: import.meta.env.DEV as boolean,
  isProd: import.meta.env.PROD as boolean,
};
