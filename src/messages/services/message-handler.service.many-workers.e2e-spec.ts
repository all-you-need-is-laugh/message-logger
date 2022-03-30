import { getRedisToken } from '@liaoliaots/nestjs-redis';
import { Scope } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import Redis from 'ioredis';
import { CommonModule } from '../../common/common.module';
import intercept from '../../common/utils/intercept';
import messagesConfig from '../config/messages.config';
import { Message } from '../entities/message.entity';
import { MessageHandlerIterationStatus } from '../enums/message-handler-iteration-status';
import { MessageHandlerService } from './message-handler.service';
import { MessagePrintingService } from './message-printing.service';
import { MessageService } from './message.service';

const SECONDS = 1000;

describe('MessageHandlerService', () => {
  let messageService: MessageService;
  let redis: Redis;
  let printedMessages: Record<string, boolean>;
  let moduleRef: TestingModule;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        CommonModule,
        ConfigModule.forFeature(messagesConfig)
      ],
      providers: [
        MessageService,
        // Create new instance every time
        {
          provide: MessageHandlerService,
          useClass: MessageHandlerService,
          scope: Scope.TRANSIENT,
        },
        {
          provide: MessagePrintingService,
          useValue: {
            printMessage: (message: Message) => {
              if (printedMessages[message.id]) {
                throw new Error(`Message "${message.text}" was already printed!`);
              }

              printedMessages[message.id] = true;
              return true;
            }
          }
        }
      ]
    }).compile();

    messageService = moduleRef.get<MessageService>(MessageService);

    redis = moduleRef.get<Redis>(getRedisToken('default'));

    await redis.del(MessageService.MESSAGES_SET_NAME);
  });

  beforeEach(() => {
    printedMessages = {};
  });

  afterEach(async () => {
    await redis.del(MessageService.MESSAGES_SET_NAME);
  });

  afterAll(async () => {
    await redis.quit();
  });

  describe('Many workers', () => {

    describe('Concurrent access', () => {
      let messageHandlerServices: MessageHandlerService[];

      beforeAll(async () => {
        messageHandlerServices = await Promise.all(
          Array.from({ length: 2 })
            .map(() => moduleRef.resolve<MessageHandlerService>(MessageHandlerService))
        );
      });

      it('should resolve concurrent access (too fast sibling message handling)', async () => {
        const [ handlerA, handlerB ] = messageHandlerServices;

        // Add 2 messages
        const startMoment = Date.now();
        const firstMessage  = new Message(startMoment - 2 * SECONDS, 'First - Slow');
        const secondMessage = new Message(startMoment - 1 * SECONDS, 'Second - Fast');

        await Promise.all([
          messageService.publishMessage(firstMessage),
          messageService.publishMessage(secondMessage)
        ]);

        // Intercept handlers to postpone message handling untill we want
        const handleMessageMockA = intercept(handlerA.handleMessage.bind(handlerA));
        handlerA.handleMessage = handleMessageMockA;
        const handleMessageMockB = intercept(handlerB.handleMessage.bind(handlerB));
        handlerB.handleMessage = handleMessageMockB;

        // Run both handlers
        const iterations = [ handlerA.runIteration(2), handlerB.runIteration(2) ];

        // Wait for both handlers pick the message to handle
        const [ handlerAMessageContext, handlerBMessageContext ] = await Promise.all([
          handleMessageMockA.deferredExecutionPromise,
          handleMessageMockB.deferredExecutionPromise
        ]);

        // We will call "Slow handler" handler, which picked "First" message
        // Meanwhile "Fast handler" must handle "Second" message (because "First" was locked by "Slow" one)
        let proceedSlowHandler;
        let proceedFastHandler;
        let fastHandlerFinishedPromise;
        if ((handlerAMessageContext.args[0] as Message).text === firstMessage.text) {
          proceedSlowHandler = handlerAMessageContext.proceed;
          fastHandlerFinishedPromise = iterations[1];
          proceedFastHandler = handlerBMessageContext.proceed;
        } else {
          proceedSlowHandler = handlerBMessageContext.proceed;
          fastHandlerFinishedPromise = iterations[0];
          proceedFastHandler = handlerAMessageContext.proceed;
        }

        // Wait for
        proceedFastHandler();
        await fastHandlerFinishedPromise;
        proceedSlowHandler();

        const results = await Promise.all(iterations);
        expect(results.every(result => result === MessageHandlerIterationStatus.MESSAGES_HANDLED)).toBe(true);

        const printedMessageIds = Object.keys(printedMessages);
        expect(printedMessageIds.length).toEqual(2);
      });

    });

    describe('Load test', () => {
      let messageHandlerServices: MessageHandlerService[];
      const NUMBER_OF_WORKERS = 30;

      beforeAll(async () => {
        messageHandlerServices = await Promise.all(
          Array.from({ length: NUMBER_OF_WORKERS })
            .map(() => moduleRef.resolve<MessageHandlerService>(MessageHandlerService))
        );
      });

      it('should handle all messages and print each of them only once', async () => {
        const NUMBER_OF_MESSAGES = 1000;
        const startMoment = Date.now();
        let iteration = 0;
        do {
          const timestamp = startMoment - (NUMBER_OF_MESSAGES - iteration) * SECONDS;
          const message = new Message(timestamp, `Message #${iteration}`);
          expect(await messageService.publishMessage(message)).toBe(true);
        } while (++iteration < NUMBER_OF_MESSAGES);

        const results = await Promise.all(
          messageHandlerServices.map(service => service.runIteration(NUMBER_OF_MESSAGES))
        );

        expect(results.every(result => result === MessageHandlerIterationStatus.MESSAGES_HANDLED)).toBe(true);

        const printedMessageIds = Object.keys(printedMessages);
        expect(printedMessageIds.length).toEqual(NUMBER_OF_MESSAGES);
      }, 30000);
    });
  });
});
