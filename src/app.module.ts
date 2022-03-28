import { RedisModule } from '@liaoliaots/nestjs-redis';
import { Module, ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { MessagesModule } from './messages/messages.module';

@Module({
  imports: [
    MessagesModule,
    // TODO: Read Redis config from config
    RedisModule.forRoot({
      config: {
        host: 'localhost',
        port: 6379,
      }
    })
  ],
})
export class AppModule {
  // TODO: set TS config setting "noImplicitAny": true,
  static async bootstrap (app) {
    app.useGlobalPipes(
      new ValidationPipe({
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
        whitelist: true,
      }),
    );

    app.useGlobalFilters(new HttpExceptionFilter());

    return app;
  }
}
