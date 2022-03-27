import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common';
import { Response } from 'express';
import { ResponsePayload } from '../entities/response-payload.entity';

@Catch()
export class HttpExceptionFilter<T extends HttpException> implements ExceptionFilter {
  catch (exception: T, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const status = exception.getStatus();

    const exceptionResponse = exception.getResponse();
    let message: string;
    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    } else {
      message = exceptionResponse['message'] || JSON.stringify(exceptionResponse);
    }

    response
      .status(status)
      .json(ResponsePayload.Failed(message));
  }
}
