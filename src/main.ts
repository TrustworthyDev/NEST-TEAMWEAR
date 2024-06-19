import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { UncaughtHttpExceptionLoggingFilter } from './common/filter/uncaught-http-exception-logging.filter';
import { json } from 'body-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['debug', 'error', 'log', 'verbose', 'warn'],
  });
  app.use(json({ limit: '50mb' }));
  app.use((req, res, next) => {
    console.log(`Request Method: ${req.method}`);
    console.log(`Request URL: ${req.url}`);
    console.log(`Request Headers: ${JSON.stringify(req.headers)}`);
    console.log(`Request Body: ${JSON.stringify(req.body)}`);
    next();
  })
  app.useGlobalFilters(new UncaughtHttpExceptionLoggingFilter());
  app.enableCors();
  await app.listen(4040);
}
bootstrap();
