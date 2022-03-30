import { Injectable, OnModuleInit } from '@nestjs/common';
import { MessageHandlerService } from '../services/message-handler.service';

@Injectable()
export class PrintMessageRoutine implements OnModuleInit {
  constructor (
    private readonly messageHandlerService: MessageHandlerService,
  ) {}

  onModuleInit () {
    this.messageHandlerService.runLoop();
  }
}

