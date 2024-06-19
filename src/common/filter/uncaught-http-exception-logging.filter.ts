import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface ExceptionObject {
  error?: string;
  message?: string;
}

@Catch(HttpException)
export class UncaughtHttpExceptionLoggingFilter implements ExceptionFilter {
  private readonly logger = new Logger('UncaughtExceptionLogger');

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const exValue: string | ExceptionObject = exception.getResponse();

    this.logger.error((exValue as ExceptionObject).error);
    this.logger.error((exValue as ExceptionObject).message);
    response.status(exception.getStatus()).send(exValue);
  }
}
