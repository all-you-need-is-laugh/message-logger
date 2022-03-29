import { RedisModule, RedisService } from '@liaoliaots/nestjs-redis';
import { Test } from '@nestjs/testing';
import Redis from 'ioredis';
import delay from '../utils/delay';
import { LockService } from './lock.service';

describe('LockService', () => {
  let lockService: LockService;
  let redis: Redis;
  let testKey;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        // TODO: read test config from service
        RedisModule.forRoot({
          config: {
            host: 'localhost',
            port: 6379,
            db: 2
          }
        })
      ],
      providers: [ LockService ],
    }).compile();

    lockService = moduleRef.get<LockService>(LockService);
    redis = moduleRef.get<RedisService>(RedisService).getClient();
  });

  beforeEach(() => {
    testKey = `MY_UNIQUE_KEY_${Date.now()}`;
  });

  afterAll(async () => {
    await redis.quit();
  });

  it('should touch lock for passed key', async () => {
    expect((await lockService.touch(testKey)).succeeded).toBe(true);
  });

  it('should touch lock for passed key, but only once during the specified TTL', async () => {
    expect((await lockService.touch(testKey)).succeeded).toBe(true);
    expect((await lockService.touch(testKey)).succeeded).toBe(false);
  });

  it('should be able to release lock', async () => {
    expect.assertions(2);

    const firstResult = await lockService.touch(testKey);

    if (!firstResult.succeeded) return;
    expect(await firstResult.release()).toBe(true);

    expect((await lockService.touch(testKey)).succeeded).toBe(true);
  });

  it('should allow to release lock only for setter request', async () => {
    expect.assertions(2);

    const firstResult = await lockService.touch(testKey, { ttl: 1 });
    if (!firstResult.succeeded) return;

    await delay(2);

    const secondResult = await lockService.touch(testKey, { ttl: 10000 });
    if (!secondResult.succeeded) return;

    expect(await firstResult.release()).toBe(false);
    expect(await secondResult.release()).toBe(true);
  });
});
