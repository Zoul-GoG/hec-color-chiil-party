export interface HealthDto {
  status: 'ok' | 'degraded';
  db: 'up' | 'down';
}
