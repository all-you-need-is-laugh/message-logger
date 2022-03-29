import { Injectable } from '@nestjs/common';
import { PrintMessageIterationStatus } from '../enums/print-message-iteration-status';
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

  async runIteration (): Promise<PrintMessageIterationStatus> {
    try {
      const messagesReady = await this.messageService.listMessages();

      if (!messagesReady.length) {
        return PrintMessageIterationStatus.NO_MESSAGES_ARE_READY;
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

      if (messagesHandled) return PrintMessageIterationStatus.MESSAGE_HANDLED;

      throw new Error('This state is not implemented!');
    } catch (error: unknown) {
      // TODO: replace with logger
      console.error('### > MessageHandlerService > runIteration > error', error);
      return PrintMessageIterationStatus.ERROR_OCCURRED;
    }
  }

  async runLoop () {
    try {
      const result = await this.runIteration();
      switch (result) {
        case PrintMessageIterationStatus.ERROR_OCCURRED:
          return setTimeout(() => this.runLoop(), RECOVERY_DELAY).unref();
        case PrintMessageIterationStatus.MESSAGE_HANDLED:
          // Go handle one more! (probably for the same time)
          return process.nextTick(() => this.runLoop());
        case PrintMessageIterationStatus.NO_MESSAGES_ARE_READY:
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

