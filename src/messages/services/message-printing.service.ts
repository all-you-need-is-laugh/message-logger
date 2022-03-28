import { Injectable } from '@nestjs/common';
import { Message } from '../entities/message.entity';

@Injectable()
export class MessagePrintingService {
  // In real life it won't be synchronous operation
  async printMessage (message: Message): Promise<boolean> {
    console.log('MessagePrintingService:', message.text);
    return true;
  }
}
