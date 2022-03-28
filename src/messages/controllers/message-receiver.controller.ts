import { Controller, Get, HttpCode, Query } from '@nestjs/common';
import { ResponsePayload } from '../../common/entities/response-payload.entity';
import { PrintMeAtDto } from '../dtos/print-me-at.dto';
import { MessageService } from '../services/message.service';

@Controller('printMeAt')
export class MessageReceiverController {
  constructor (
    private messageService: MessageService
  ) {}

  @Get('/')
  @HttpCode(201)
  async printMeAt (@Query() printMeAtDto: PrintMeAtDto) {
    return ResponsePayload.Succeeded(await this.messageService.publishMessage(printMeAtDto));
  }
}
