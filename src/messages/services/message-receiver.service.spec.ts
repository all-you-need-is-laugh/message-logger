import { RedisModule, RedisService } from '@liaoliaots/nestjs-redis';
import { Test } from '@nestjs/testing';
import Redis from 'ioredis';
import { Message } from '../entities/message.entity';
import { MessageReceiverService } from './message-receiver.service';

const SECONDS = 1000;

describe('MessageReceiverService', () => {
  let messageReceiverService: MessageReceiverService;
  let redis: Redis;

  beforeEach(async () => {
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
      providers: [ MessageReceiverService ],
    }).compile();

    messageReceiverService = moduleRef.get<MessageReceiverService>(MessageReceiverService);
    redis = moduleRef.get<RedisService>(RedisService).getClient();
  });

  afterEach(async () => {
    await redis.del(MessageReceiverService.MESSAGES_SET_NAME);
  });

  it('should add message in ordered by timestamp list', async () => {
    const startMoment = Date.now();
    const firstMessage        = new Message(startMoment + 10 * SECONDS, 'First');
    const secondMessage       = new Message(startMoment + 20 * SECONDS, 'Second');
    const thirdMessage        = new Message(startMoment + 30 * SECONDS, 'Third');
    const anotherThirdMessage = new Message(startMoment + 30 * SECONDS, 'Another Third');

    expect(await messageReceiverService.publishMessage(thirdMessage)).toBe(true);
    expect(await messageReceiverService.publishMessage(firstMessage)).toBe(true);
    expect(await messageReceiverService.publishMessage(secondMessage)).toBe(true);
    expect(await messageReceiverService.publishMessage(anotherThirdMessage)).toBe(true);

    const storedMessages = await messageReceiverService.listMessages({
      fromTime: startMoment,
      toTime: startMoment + 100 * SECONDS
    });

    expect(storedMessages.slice(0, 2)).toEqual([ { ...firstMessage }, { ...secondMessage }, ]);

    // Both "third" messages can be in any order, so check their presence with `toContainEqual`
    expect(storedMessages.slice(2, 4)).toContainEqual({ ...thirdMessage });
    expect(storedMessages.slice(2, 4)).toContainEqual({ ...anotherThirdMessage });
  });

  it('should list messages from specified time range', async () => {
    const startMoment = Date.now();
    const firstMessage  = new Message(startMoment + 10 * SECONDS, 'First');
    const secondMessage = new Message(startMoment + 20 * SECONDS, 'Second');
    const thirdMessage  = new Message(startMoment + 30 * SECONDS, 'Third');

    expect(await messageReceiverService.publishMessage(thirdMessage)).toBe(true);
    expect(await messageReceiverService.publishMessage(firstMessage)).toBe(true);
    expect(await messageReceiverService.publishMessage(secondMessage)).toBe(true);

    expect(await messageReceiverService.listMessages({ fromTime: 0, toTime: startMoment }))
      .toEqual([]);

    expect(await messageReceiverService.listMessages({ fromTime: 0, toTime: startMoment + 10 * SECONDS }))
      .toEqual([ { ...firstMessage } ]);

    expect(await messageReceiverService.listMessages({
      fromTime: startMoment + 10 * SECONDS,
      toTime: startMoment + 25 * SECONDS
    }))
      .toEqual([ { ...firstMessage }, { ...secondMessage } ]);

    expect(await messageReceiverService.listMessages({
      fromTime: startMoment + 31 * SECONDS,
      toTime: startMoment + 32 * SECONDS
    }))
      .toEqual([]);
  });
});
