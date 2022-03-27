import { Module, ValidationPipe } from '@nestjs/common';
import { MessagesModule } from './messages/messages.module';

@Module({
  imports: [ MessagesModule ],
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

    return app;
  }
}
