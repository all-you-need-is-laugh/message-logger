import { Injectable } from '@nestjs/common';
import { MessageHandlerIterationStatus } from '../enums/message-handler-iteration-status';
import { MessagePrintingService } from '../services/message-printing.service';
import { MessageService } from '../services/message.service';

// TODO: read delay values from config
const WAIT_FOR_NEW_MESSAGES_DELAY = 1000;
const RECOVERY_DELAY = 30000;

@Injectable()
export class MessageHandlerService {
  constructor (
    private messageService: MessageService,
    private messagePrintingService: MessagePrintingService
  ) {}

  async runIteration (): Promise<MessageHandlerIterationStatus> {
    try {
      const messagesReady = await this.messageService.listMessages();

      if (!messagesReady.length) {
        return MessageHandlerIterationStatus.NO_MESSAGES_ARE_READY;
      }

      let messagesHandled = 0;
      for (const message of messagesReady) {
      // TODO: set lock here
        if (await this.messagePrintingService.printMessage(message)) {
          await this.messageService.remove(message);
        }
        // TODO: release lock here
        messagesHandled++;
      }

      if (messagesHandled) return MessageHandlerIterationStatus.MESSAGES_HANDLED;

      throw new Error('This state is not implemented!');
    } catch (error: unknown) {
      // TODO: replace with logger
      console.error('### > MessageHandlerService > runIteration > error', error);
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
      console.error('### > MessageHandlerService > runLoop > exception', exception);
      // Try to restart after some bigger delay
      setTimeout(() => this.runLoop(), RECOVERY_DELAY).unref();
    }
  }
}

