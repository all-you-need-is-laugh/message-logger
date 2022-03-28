import { RedisModule, RedisService } from '@liaoliaots/nestjs-redis';
import { Test } from '@nestjs/testing';
import Redis from 'ioredis';
import { Message } from '../entities/message.entity';
import { PrintMessageIterationStatus } from '../enums/print-message-iteration-status';
import { MessagePrintingService } from '../services/message-printing.service';
import { MessageService } from '../services/message.service';
import { PrintMessageRoutine } from './print-message.routine';

const SECONDS = 1000;

describe('PrintMessageRoutine', () => {
  let printMessageRoutine: PrintMessageRoutine;
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
        PrintMessageRoutine,
        {
          provide: MessagePrintingService,
          useValue: { printMessage: () => true }
        }
      ]
    }).compile();

    messageService = moduleRef.get<MessageService>(MessageService);
    printMessageRoutine = moduleRef.get<PrintMessageRoutine>(PrintMessageRoutine);
    redis = moduleRef.get<RedisService>(RedisService).getClient();

    await redis.del(MessageService.MESSAGES_SET_NAME);
  });

  afterEach(async () => {
    await redis.del(MessageService.MESSAGES_SET_NAME);
  });

  it('should handle empty list of ready messages', async () => {
    const result = await printMessageRoutine.runIteration();

    expect(result).toEqual({ status: PrintMessageIterationStatus.NO_MESSAGES_ARE_READY });
  });

  it('should handle first ready message from the queue', async () => {
    const startMoment = Date.now();
    const firstMessage  = new Message(startMoment - 2 * SECONDS, 'First');
    const secondMessage = new Message(startMoment - 1 * SECONDS, 'Second');

    expect(await messageService.publishMessage(firstMessage)).toBe(true);
    expect(await messageService.publishMessage(secondMessage)).toBe(true);

    const result = await printMessageRoutine.runIteration();

    expect(result).toEqual({
      status: PrintMessageIterationStatus.MESSAGE_HANDLED
    });
  });
});
