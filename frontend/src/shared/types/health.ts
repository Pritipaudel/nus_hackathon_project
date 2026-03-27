export type HealthStatus = 'loading' | 'ok' | 'error';

export interface HealthResponse {
  status: string;
}
