import { Controller, Get, Query } from '@nestjs/common';
import { PrintMeAtDto } from '../dtos/print-me-at.dto';

@Controller('printMeAt')
export class MessageReceiverController {
  @Get('/')
  async printMeAt(@Query() printMeAtDto: PrintMeAtDto) {
    return printMeAtDto;
  }
}
