import { Injectable } from '@nestjs/common';
import { LockService } from '../../common/lock/lock.service';
import { Message } from '../entities/message.entity';
import { MessageHandlerIterationStatus } from '../enums/message-handler-iteration-status';
import { MessagePrintingService } from '../services/message-printing.service';
import { MessageService } from '../services/message.service';

// TODO: read values from config
const WAIT_FOR_NEW_MESSAGES_DELAY = 1000;
const RECOVERY_DELAY = 30000;
const ITERATION_DURATION = 10000;
const LOCK_DURATION = ITERATION_DURATION * 2;
const ITERATION_BATCH_SIZE = 10;

@Injectable()
export class MessageHandlerService {
  constructor (
    private readonly messageService: MessageService,
    private readonly messagePrintingService: MessagePrintingService,
    private readonly lockService: LockService
  ) {
  }

  async handleMessage (message: Message): Promise<boolean> {
    const printResult = await this.messagePrintingService.printMessage(message);

    if (!printResult) return false;

    return this.messageService.remove(message);
  }

  async runIteration (batchSize: number): Promise<MessageHandlerIterationStatus> {
    try {
      const messagesReady = await this.messageService.listMessages({ count: batchSize });

      if (!messagesReady.length) {
        return MessageHandlerIterationStatus.NO_MESSAGES_ARE_READY;
      }

      let messagesHandled = 0;
      const stopIterationAt = Date.now() + ITERATION_DURATION;
      for (const message of messagesReady) {
        // Stop the iteration and start the new one with another batch of messages
        if (Date.now() >= stopIterationAt) {
          return messagesHandled
            ? MessageHandlerIterationStatus.MESSAGES_HANDLED
            : MessageHandlerIterationStatus.ALL_MESSAGES_ARE_BUSY;
        }

        const lockResult = await this.lockService.touch(`message_${message.id}`, LOCK_DURATION);

        if (!lockResult.succeeded) continue;

        const handleResult = await this.handleMessage(message);

        // Just don't release lock here - keep it set for concurrency resolution
        // await lockResult.release();

        if (handleResult) messagesHandled++;
      }

      if (messagesHandled) return MessageHandlerIterationStatus.MESSAGES_HANDLED;

      return MessageHandlerIterationStatus.ALL_MESSAGES_ARE_BUSY;
    } catch (error: unknown) {
      // TODO: replace with logger
      return MessageHandlerIterationStatus.ERROR_OCCURRED;
    }
  }

  async runLoop () {
    try {
      const result = await this.runIteration(ITERATION_BATCH_SIZE);
      switch (result) {
        case MessageHandlerIterationStatus.ERROR_OCCURRED:
          return setTimeout(() => this.runLoop(), RECOVERY_DELAY).unref();

        case MessageHandlerIterationStatus.MESSAGES_HANDLED:
          // Go handle one more! (probably for the same time)
          return process.nextTick(() => this.runLoop());

        case MessageHandlerIterationStatus.ALL_MESSAGES_ARE_BUSY:
        case MessageHandlerIterationStatus.NO_MESSAGES_ARE_READY:
          return setTimeout(() => this.runLoop(), WAIT_FOR_NEW_MESSAGES_DELAY).unref();

        default:
          const exhaustiveCheck: never = result;
          throw new Error(`Unhandled iteration result: ${exhaustiveCheck}`);
      }
    } catch (exception: unknown) {
      // TODO: replace with logger
      console.error('### > MessageHandlerService > runLoop > exception', exception);
      // Try to restart after some bigger delay
      setTimeout(() => this.runLoop(), RECOVERY_DELAY).unref();
    }
  }
}

