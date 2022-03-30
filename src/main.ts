import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import appConfig from './common/config/app.config';

async function bootstrap () {
  const app = await NestFactory.create(AppModule);

  AppModule.bootstrap(app);

  const port = appConfig().port;
  await app.listen(port);

  // TODO: replace with logger
  console.log(`Server is listening on port ${port}`);
}
bootstrap();
