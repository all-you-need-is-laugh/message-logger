import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import appConfig from './config/app.config';

async function bootstrap () {
  const app = await NestFactory.create(AppModule);

  AppModule.bootstrap(app);

  await app.listen(appConfig().port);
}
bootstrap();
