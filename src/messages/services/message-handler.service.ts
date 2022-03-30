import { Injectable } from '@nestjs/common';
import { LockService } from '../../common/lock/lock.service';
import { Message } from '../entities/message.entity';
import { MessageHandlerIterationStatus } from '../enums/message-handler-iteration-status';
import { MessagePrintingService } from '../services/message-printing.service';
import { MessageService } from '../services/message.service';

// TODO: read delay values from config
const WAIT_FOR_NEW_MESSAGES_DELAY = 1000;
const RECOVERY_DELAY = 30000;
const LOCK_DURATION = ITERATION_DURATION * 2;

@Injectable()
export class MessageHandlerService {
  constructor (
    private messageService: MessageService,
    private messagePrintingService: MessagePrintingService,
    private lockService: LockService
  ) {
  }

  async handleMessage (message: Message): Promise<boolean> {
    const printResult = await this.messagePrintingService.printMessage(message);

    if (!printResult) return false;

    return this.messageService.remove(message);
  }

  async runIteration (batchSize = 10): Promise<MessageHandlerIterationStatus> {
    try {
      const messagesReady = await this.messageService.listMessages({ count: batchSize });

      if (!messagesReady.length) {
        return MessageHandlerIterationStatus.NO_MESSAGES_ARE_READY;
      }

      let messagesHandled = 0;
      for (const message of messagesReady) {
        // TODO: check iteration timeout here
        const lockResult = await this.lockService.touch(`message_${message.id}`, LOCK_DURATION);

        if (!lockResult.succeeded) continue;

        const handleResult = await this.handleMessage(message);

        // Just don't release lock here - keep it set for concurrency resolution
        // await lockResult.release();

        if (handleResult) messagesHandled++;
      }

      if (messagesHandled) return MessageHandlerIterationStatus.MESSAGES_HANDLED;

      throw new Error('This state is not implemented!');
    } catch (error: unknown) {
      // TODO: replace with logger
      return MessageHandlerIterationStatus.ERROR_OCCURRED;
    }
  }

  async runLoop () {
    try {
      const result = await this.runIteration();
      switch (result) {
        case MessageHandlerIterationStatus.ERROR_OCCURRED:
          return setTimeout(() => this.runLoop(), RECOVERY_DELAY).unref();
        case MessageHandlerIterationStatus.MESSAGES_HANDLED:
          // Go handle one more! (probably for the same time)
          return process.nextTick(() => this.runLoop());
        case MessageHandlerIterationStatus.NO_MESSAGES_ARE_READY:
          return setTimeout(() => this.runLoop(), WAIT_FOR_NEW_MESSAGES_DELAY).unref();

        default:
          const exhaustiveCheck: never = result;
          throw new Error(`Unhandled iteration result: ${exhaustiveCheck}`);
      }
    } catch (exception: unknown) {
      // TODO: replace with logger
      // Try to restart after some bigger delay
      setTimeout(() => this.runLoop(), RECOVERY_DELAY).unref();
    }
  }
}

