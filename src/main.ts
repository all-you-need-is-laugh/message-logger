import { Logger, NestApplicationOptions } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import appConfig from './common/config/app.config';

async function bootstrap () {
  const { environment, port } = appConfig();
  const appOptions = {} as NestApplicationOptions;

  if (environment === 'production') {
    appOptions.logger = [ 'error', 'warn' ];
  }

  const app = await NestFactory.create(AppModule, appOptions);

  AppModule.bootstrap(app);

  await app.listen(port);

  Logger.log(`Server is listening on port ${port}`, 'main');
}
bootstrap();
