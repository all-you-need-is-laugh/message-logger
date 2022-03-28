import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap () {
  const app = await NestFactory.create(AppModule);

  AppModule.bootstrap(app);

  // TODO: Read port from config
  await app.listen(3000);
}
bootstrap();
