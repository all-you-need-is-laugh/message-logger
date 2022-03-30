import { InjectRedis } from '@liaoliaots/nestjs-redis';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import Redis from 'ioredis';
import { v4 as uuidV4 } from 'uuid';
import lockConfig from '../config/lock.config';

interface LockSetSuccessfully {
  succeeded: true,
  release: () => void
}
interface LockSetUnsuccessfully {
  succeeded: false,
}

type LockSetResult = LockSetSuccessfully | LockSetUnsuccessfully;

@Injectable()
export class LockService {
  constructor (
    @InjectRedis()
    private readonly redis: Redis,
    @Inject(lockConfig.KEY)
    private readonly config: ConfigType<typeof lockConfig>
  ) {}

  async touch (key: string, ttl: number): Promise<LockSetResult> {
    const lockKey = `${this.config.prefix}:${key}`;
    const lockValue = uuidV4();
    const result = await this.redis.set(lockKey, lockValue, 'PX', ttl, 'NX');

    return (result === 'OK'
      ? { succeeded: true, release: () => this.release(lockKey, lockValue) }
      : { succeeded: false }
    );
  }

  async release (key: string, value: string): Promise<boolean> {
    const result = await this.redis.eval(`
      if redis.call("get",KEYS[1]) == ARGV[1]
      then
        return redis.call("del",KEYS[1])
      else
        return 0
      end
    `, 1, [ key, value ]);
    return result === 1;
  }
}
