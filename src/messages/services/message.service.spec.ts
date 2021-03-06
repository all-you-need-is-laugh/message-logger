import { getRedisToken } from '@liaoliaots/nestjs-redis';
import { Test } from '@nestjs/testing';
import Redis from 'ioredis';
import { CommonModule } from '../../common/common.module';
import { Message } from '../entities/message.entity';
import { MessageService } from './message.service';

const SECONDS = 1000;

describe('MessageService', () => {
  let messageService: MessageService;
  let redis: Redis;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [ CommonModule ],
      providers: [ MessageService ],
    }).compile();

    messageService = moduleRef.get<MessageService>(MessageService);
    redis = moduleRef.get<Redis>(getRedisToken('default'));

    await redis.del(MessageService.MESSAGES_SET_NAME);
  });

  afterEach(async () => {
    await redis.del(MessageService.MESSAGES_SET_NAME);
  });

  afterAll(async () => {
    await redis.quit();
  });

  it('should add message to ordered by timestamp list', async () => {
    const startMoment = Date.now();
    const firstMessage        = new Message(startMoment + 10 * SECONDS, 'First');
    const secondMessage       = new Message(startMoment + 20 * SECONDS, 'Second');
    const thirdMessage        = new Message(startMoment + 30 * SECONDS, 'Third');
    const anotherThirdMessage = new Message(startMoment + 30 * SECONDS, 'Another Third');

    expect(await messageService.publishMessage(thirdMessage)).toBe(true);
    expect(await messageService.publishMessage(firstMessage)).toBe(true);
    expect(await messageService.publishMessage(secondMessage)).toBe(true);
    expect(await messageService.publishMessage(anotherThirdMessage)).toBe(true);

    const storedMessages = await messageService.listMessages({
      fromTime: startMoment,
      toTime: startMoment + 100 * SECONDS
    });

    expect(storedMessages.slice(0, 2)).toEqual([ { ...firstMessage }, { ...secondMessage }, ]);

    // Both "third" messages can be in any order, so check their presence with `toContainEqual`
    expect(storedMessages.slice(2, 4)).toContainEqual({ ...thirdMessage });
    expect(storedMessages.slice(2, 4)).toContainEqual({ ...anotherThirdMessage });
  });

  it('should list messages for specified time range', async () => {
    const startMoment = Date.now();
    const firstMessage  = new Message(startMoment + 10 * SECONDS, 'First');
    const secondMessage = new Message(startMoment + 20 * SECONDS, 'Second');
    const thirdMessage  = new Message(startMoment + 30 * SECONDS, 'Third');

    expect(await messageService.publishMessage(thirdMessage)).toBe(true);
    expect(await messageService.publishMessage(firstMessage)).toBe(true);
    expect(await messageService.publishMessage(secondMessage)).toBe(true);

    expect(await messageService.listMessages({ fromTime: 0, toTime: startMoment }))
      .toEqual([]);

    expect(await messageService.listMessages({ fromTime: 0, toTime: startMoment + 10 * SECONDS }))
      .toEqual([ { ...firstMessage } ]);

    expect(await messageService.listMessages({
      fromTime: startMoment + 10 * SECONDS,
      toTime: startMoment + 25 * SECONDS
    }))
      .toEqual([ { ...firstMessage }, { ...secondMessage } ]);

    expect(await messageService.listMessages({
      fromTime: startMoment + 31 * SECONDS,
      toTime: startMoment + 32 * SECONDS
    }))
      .toEqual([]);
  });

  it('should remove message from the list', async () => {
    const startMoment = Date.now();
    const firstMessage  = new Message(startMoment + 10 * SECONDS, 'First');
    const secondMessage = new Message(startMoment + 20 * SECONDS, 'Second');
    const thirdMessage  = new Message(startMoment + 30 * SECONDS, 'Third');

    expect(await messageService.publishMessage(thirdMessage)).toBe(true);
    expect(await messageService.publishMessage(firstMessage)).toBe(true);
    expect(await messageService.publishMessage(secondMessage)).toBe(true);

    const allAddedMessages = await messageService.listMessages({
      fromTime: startMoment,
      toTime: startMoment + 100 * SECONDS
    });

    expect(allAddedMessages).toEqual([ { ...firstMessage }, { ...secondMessage }, { ...thirdMessage } ]);

    expect(await messageService.remove(secondMessage)).toBe(true);

    const restMessages = await messageService.listMessages({
      fromTime: startMoment,
      toTime: startMoment + 100 * SECONDS
    });

    expect(restMessages).toEqual([ { ...firstMessage }, { ...thirdMessage } ]);
  });
});
