import { registerAs } from '@nestjs/config';

// TODO: add schema and remove default values
export default registerAs('lock', (envMap: Record<string, string> = process.env) => ({
  prefix: envMap.LOCK_PREFIX || 'lock',
}));
