export type Environment = 'development' | 'staging' | 'production';

export interface EnvConfig {
  apiBaseUrl: string;
  appName: string;
  appEnv: Environment;
  isDev: boolean;
  isProd: boolean;
}
