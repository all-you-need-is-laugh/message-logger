import { Module } from '@nestjs/common';
import { MessageReceiverController } from './controllers/message-receiver.controller';
import { PrintMessageRoutine } from './routines/print-message.routine';
import { MessagePrintingService } from './services/message-printing.service';
import { MessageService } from './services/message.service';

@Module({
  controllers: [ MessageReceiverController ],
  providers: [ MessageService, PrintMessageRoutine, MessagePrintingService ],
})
export class MessagesModule {}
