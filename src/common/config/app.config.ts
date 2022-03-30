import { registerAs } from '@nestjs/config';

// TODO: add schema and remove default values
// Values have 1 at the end to emphasis that they're took from here
export default registerAs('app', (envMap: Record<string, string> = process.env) => ({
  environment: envMap.NODE_ENV || 'development',
  port: parseInt(envMap.SERVER_PORT, 10) || 3001
}));
