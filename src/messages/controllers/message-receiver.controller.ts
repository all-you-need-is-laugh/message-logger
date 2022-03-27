import { Controller, Get, HttpCode, Query } from '@nestjs/common';
import { ResponsePayload } from '../../common/entities/response-payload.entity';
import { PrintMeAtDto } from '../dtos/print-me-at.dto';
import { MessageReceiverService } from '../services/message-receiver.service';

@Controller('printMeAt')
export class MessageReceiverController {
  constructor (
    private messageReceiverService: MessageReceiverService
  ) {}

  @Get('/')
  @HttpCode(201)
  async printMeAt (@Query() printMeAtDto: PrintMeAtDto) {
    return ResponsePayload.Succeeded(await this.messageReceiverService.publishMessage(printMeAtDto));
  }
}
