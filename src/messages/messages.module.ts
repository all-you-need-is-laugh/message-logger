import { Module } from '@nestjs/common';
import { MessageReceiverController } from './controllers/message-receiver.controller';
import { MessageService } from './services/message.service';

@Module({
  controllers: [ MessageReceiverController ],
  providers: [ MessageService ],
})
export class MessagesModule {}
