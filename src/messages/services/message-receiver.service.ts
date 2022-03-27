import { Injectable } from '@nestjs/common';
import { Message } from '../entities/message.entity';

@Injectable()
export class MessageReceiverService {
  private messages: Message[] = [];

  async listMessages (fromTime: number, toTime: number) {
    return this.messages.filter(message => fromTime <= message.timestamp && message.timestamp <= toTime);
  }

  async publishMessage (message: Message) {
    this.messages.push(message);
    this.messages.sort((message1, message2) => message1.timestamp - message2.timestamp);

    return true;
  }
}
