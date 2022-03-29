import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrintMessageIterationStatus } from '../enums/print-message-iteration-status';
import { MessagePrintingService } from '../services/message-printing.service';
import { MessageService } from '../services/message.service';

@Injectable()
export class PrintMessageRoutine implements OnModuleInit {
  constructor (
    private messageService: MessageService,
    private messagePrintingService: MessagePrintingService
  ) {}

  onModuleInit () {
    process.nextTick(() => this.runLoop());
  }

  async runIteration (): Promise<PrintMessageIterationStatus> {
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
  }

  async runLoop () {
    try {
      const result = await this.runIteration();
      switch (result) {
        case PrintMessageIterationStatus.MESSAGE_HANDLED:
          // Go handle one more! (probably for the same time)
          return process.nextTick(() => this.runLoop());
        case PrintMessageIterationStatus.NO_MESSAGES_ARE_READY:
          // TODO: read delay value from config
          return setTimeout(() => this.runLoop(), 1000).unref();

        default:
          const exhaustiveCheck: never = result;
          throw new Error(`Unhandled iteration result: ${exhaustiveCheck}`);
      }
    } catch (err: unknown) {
      // TODO: replace with logger
      console.log('### > PrintMessageRoutine > runLoop > err', err);
      // Try to run from the start
      setTimeout(() => this.runLoop(), 30000).unref();
    }
  }
}

