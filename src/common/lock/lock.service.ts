import { InjectRedis } from '@liaoliaots/nestjs-redis';
import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { v4 as uuidV4 } from 'uuid';

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
  // TODO: read from config
  private static LOCK_PREFIX = 'lock';

  constructor (
    @InjectRedis() private readonly redis: Redis
  ) {}

  async touch (key: string, ttl: number): Promise<LockSetResult> {
    const lockKey = `${LockService.LOCK_PREFIX}:${key}`;
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
