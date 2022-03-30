import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { LockService } from '../../common/lock/lock.service';
import messagesConfig from '../config/messages.config';
import { Message } from '../entities/message.entity';
import { MessageHandlerIterationStatus } from '../enums/message-handler-iteration-status';
import { MessagePrintingService } from '../services/message-printing.service';
import { MessageService } from '../services/message.service';

@Injectable()
export class MessageHandlerService {
  private readonly logger = new Logger(MessageHandlerService.name);

  constructor (
    private readonly messageService: MessageService,
    private readonly messagePrintingService: MessagePrintingService,
    private readonly lockService: LockService,
    @Inject(messagesConfig.KEY)
    private readonly config: ConfigType<typeof messagesConfig>
  ) { }

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

      this.logger.log(`runIteration > messages ready: ${messagesReady.length}/${batchSize}`);

      let messagesHandled = 0;
      const stopIterationAt = Date.now() + this.config.handler.iterationDuration;
      for (const message of messagesReady) {
        // Stop the iteration and start the new one with another batch of messages
        if (Date.now() >= stopIterationAt) {
          this.logger.log(`runIteration < messages handled before timeout: ${messagesHandled}/${messagesReady.length}`);

          return messagesHandled
            ? MessageHandlerIterationStatus.MESSAGES_HANDLED
            : MessageHandlerIterationStatus.ALL_MESSAGES_ARE_BUSY;
        }

        const lockResult = await this.lockService.touch(`message_${message.id}`, this.config.handler.lockDuration);

        if (!lockResult.succeeded) continue;

        const handleResult = await this.handleMessage(message);

        // Just don't release lock here - keep it set for concurrency resolution
        // await lockResult.release();

        if (handleResult) messagesHandled++;
      }

      this.logger.log(`runIteration < messages handled: ${messagesHandled}/${messagesReady.length}`);

      if (messagesHandled) return MessageHandlerIterationStatus.MESSAGES_HANDLED;

      return MessageHandlerIterationStatus.ALL_MESSAGES_ARE_BUSY;
    } catch (exception: unknown) {
      this.logger.error(`runIteration < exception: ${exception}`);
      return MessageHandlerIterationStatus.ERROR_OCCURRED;
    }
  }

  async runLoop (): Promise<void> {
    try {
      const result = await this.runIteration(this.config.handler.iterationBatchSize);
      switch (result) {
        case MessageHandlerIterationStatus.ERROR_OCCURRED:
          setTimeout(() => this.runLoop(), this.config.handler.recoveryDelay).unref();
          return;

        case MessageHandlerIterationStatus.MESSAGES_HANDLED:
          // Go handle one more! (probably for the same time)
          return process.nextTick(() => this.runLoop());

        case MessageHandlerIterationStatus.ALL_MESSAGES_ARE_BUSY:
        case MessageHandlerIterationStatus.NO_MESSAGES_ARE_READY:
          setTimeout(() => this.runLoop(), this.config.handler.waitForNewMessagesDelay).unref();
          return;

        default:
          const exhaustiveCheck: never = result;
          throw new Error(`Unhandled iteration result: ${exhaustiveCheck}`);
      }
    } catch (exception: unknown) {
      this.logger.error(`runLoop exception: ${exception}`);
      // Try to restart after some bigger delay
      setTimeout(() => this.runLoop(), this.config.handler.recoveryDelay).unref();
    }
  }
}

