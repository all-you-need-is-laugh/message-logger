import { Test } from '@nestjs/testing';
import { Message } from '../entities/message.entity';
import { MessageReceiverService } from './message-receiver.service';

const SECONDS = 1000;

describe('MessageReceiverService', () => {
  let messageReceiverService: MessageReceiverService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [ MessageReceiverService ],
    }).compile();

    messageReceiverService = moduleRef.get<MessageReceiverService>(MessageReceiverService);
  });

  it('should add message in ordered by timestamp list', async () => {
    const startMoment = Date.now();
    const firstMessage  = new Message(startMoment + 10 * SECONDS, 'First');
    const secondMessage = new Message(startMoment + 20 * SECONDS, 'Second');
    const thirdMessage  = new Message(startMoment + 30 * SECONDS, 'Third');

    expect(await messageReceiverService.publishMessage(thirdMessage)).toBe(true);
    expect(await messageReceiverService.publishMessage(firstMessage)).toBe(true);
    expect(await messageReceiverService.publishMessage(secondMessage)).toBe(true);

    const storedMessages = await messageReceiverService.listMessages(startMoment, startMoment + 100 * SECONDS);

    expect(storedMessages).toEqual([ { ...firstMessage }, { ...secondMessage }, { ...thirdMessage } ]);
  });

  it('should list messages from specified time range', async () => {
    const startMoment = Date.now();
    const firstMessage  = new Message(startMoment + 10 * SECONDS, 'First');
    const secondMessage = new Message(startMoment + 20 * SECONDS, 'Second');
    const thirdMessage  = new Message(startMoment + 30 * SECONDS, 'Third');

    expect(await messageReceiverService.publishMessage(thirdMessage)).toBe(true);
    expect(await messageReceiverService.publishMessage(firstMessage)).toBe(true);
    expect(await messageReceiverService.publishMessage(secondMessage)).toBe(true);

    expect(await messageReceiverService.listMessages(0, startMoment))
      .toEqual([]);

    expect(await messageReceiverService.listMessages(0, startMoment + 10 * SECONDS))
      .toEqual([ { ...firstMessage } ]);

    expect(await messageReceiverService.listMessages(startMoment + 10 * SECONDS, startMoment + 25 * SECONDS))
      .toEqual([ { ...firstMessage }, { ...secondMessage } ]);

    expect(await messageReceiverService.listMessages(startMoment + 31 * SECONDS, startMoment + 32 * SECONDS))
      .toEqual([]);
  });
});
