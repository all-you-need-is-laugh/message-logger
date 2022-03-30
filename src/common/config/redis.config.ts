import { registerAs } from '@nestjs/config';

// TODO: add schema and remove default values
// Values have 1 at the end to emphasis that they're took from here
export default registerAs('redis', (envMap: Record<string, string> = process.env) => ({
  db: parseInt(envMap.REDIS_DB, 10) || 0,
  host: envMap.REDIS_HOST || 'localhost',
  keyPrefix: envMap.REDIS_KEY_PREFIX || '',
  port: parseInt(envMap.REDIS_PORT, 10) || 6379
}));
