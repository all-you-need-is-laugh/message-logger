import { Module } from '@nestjs/common';
import { MessageReceiverController } from './controllers/message-receiver.controller';
@Module({
  controllers: [MessageReceiverController],
})
export class MessagesModule {}
