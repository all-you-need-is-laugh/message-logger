import { Controller, Get, HttpCode, Query } from '@nestjs/common';
import { ResponsePayload } from '../../common/entities/response-payload.entity';
import { PrintMeAtDto } from '../dtos/print-me-at.dto';

@Controller('printMeAt')
export class MessageReceiverController {
  @Get('/')
  @HttpCode(201)
  async printMeAt (@Query() printMeAtDto: PrintMeAtDto) {
    return ResponsePayload.Succeeded(!!printMeAtDto);
  }
}
