import { Module } from '@nestjs/common';
import { MessageReceiverController } from './controllers/message-receiver.controller';
import { MessageReceiverService } from './services/message-receiver.service';

@Module({
  controllers: [ MessageReceiverController ],
  providers: [ MessageReceiverService ],
})
export class MessagesModule {}
