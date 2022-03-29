import { RedisModule, RedisService } from '@liaoliaots/nestjs-redis';
import { Test } from '@nestjs/testing';
import Redis from 'ioredis';
import { Message } from '../entities/message.entity';
import { PrintMessageIterationStatus } from '../enums/print-message-iteration-status';
import { MessageHandlerService } from './message-handler.service';
import { MessagePrintingService } from './message-printing.service';
import { MessageService } from './message.service';

const SECONDS = 1000;

describe('MessageHandlerService', () => {
  let messageHandlerService: MessageHandlerService;
  let messageService: MessageService;
  let redis: Redis;

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
      providers: [
        MessageService,
        MessageHandlerService,
        {
          provide: MessagePrintingService,
          useValue: { printMessage: () => true }
        }
      ]
    }).compile();

    messageService = moduleRef.get<MessageService>(MessageService);
    messageHandlerService = moduleRef.get<MessageHandlerService>(MessageHandlerService);
    redis = moduleRef.get<RedisService>(RedisService).getClient();

    await redis.del(MessageService.MESSAGES_SET_NAME);
  });

  afterEach(async () => {
    await redis.del(MessageService.MESSAGES_SET_NAME);
  });

  afterAll(async () => {
    await redis.quit();
  });

  describe('One worker', () => {

    it('should handle empty list of ready messages', async () => {
      const result = await messageHandlerService.runIteration();

      expect(result).toEqual(PrintMessageIterationStatus.NO_MESSAGES_ARE_READY);
    });

    it('should handle first ready message from the queue', async () => {
      const startMoment = Date.now();
      const firstMessage  = new Message(startMoment - 2 * SECONDS, 'First');
      const secondMessage = new Message(startMoment - 1 * SECONDS, 'Second');

      expect(await messageService.publishMessage(firstMessage)).toBe(true);
      expect(await messageService.publishMessage(secondMessage)).toBe(true);

      const result = await messageHandlerService.runIteration();

      expect(result).toEqual(PrintMessageIterationStatus.MESSAGE_HANDLED);
    });

    it('should handle errors (for example: no connection to Redis)', async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [
          RedisModule.forRoot({
            config: {
              host: 'wrong-redis-server-host',
              // disable retry for test
              retryStrategy: () => null,
            }
          })
        ],
        providers: [
          MessageService,
          MessageHandlerService,
          {
            provide: MessagePrintingService,
            useValue: { printMessage: () => true }
          }
        ]
      }).compile();

      messageHandlerService = moduleRef.get<MessageHandlerService>(MessageHandlerService);

      const result = await messageHandlerService.runIteration();

      expect(result).toEqual(PrintMessageIterationStatus.ERROR_OCCURRED);
    });
  });
});
