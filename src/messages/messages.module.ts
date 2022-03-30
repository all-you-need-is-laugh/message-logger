import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import messagesConfig from './config/messages.config';
import { MessageReceiverController } from './controllers/message-receiver.controller';
import { PrintMessageRoutine } from './routines/print-message.routine';
import { MessageHandlerService } from './services/message-handler.service';
import { MessagePrintingService } from './services/message-printing.service';
import { MessageService } from './services/message.service';

interface MessagesModuleRegistrationOptions {
  skipRoutines?: boolean
}

@Module({})
export class MessagesModule {
  static register (options?: MessagesModuleRegistrationOptions): DynamicModule {
    const routineProviders = options?.skipRoutines ? [] : [ PrintMessageRoutine ];

    return {
      module: MessagesModule,
      imports: [ ConfigModule.forFeature(messagesConfig) ],
      controllers: [ MessageReceiverController ],
      providers: [
        MessageService,
        MessageHandlerService,
        MessagePrintingService,
        ...routineProviders,
      ],
    };
  }
}
