import { RedisModule } from '@liaoliaots/nestjs-redis';
import { INestApplication, Module, ValidationPipe } from '@nestjs/common';
import { CommonModule } from './common/common.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { MessagesModule } from './messages/messages.module';

@Module({
  imports: [
    MessagesModule.register(),
    // TODO: Read Redis config from config
    RedisModule.forRoot({
      config: {
        host: 'localhost',
        port: 6379,
      }
    }),
    CommonModule
  ],
})
export class AppModule {
  // TODO: set TS config setting "noImplicitAny": true,
  static async bootstrap (app: INestApplication) {
    app.useGlobalPipes(
      new ValidationPipe({
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
        whitelist: true,
      }),
    );

    app.useGlobalFilters(new HttpExceptionFilter());

    app.enableShutdownHooks();

    return app;
  }
}
