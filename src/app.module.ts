import { INestApplication, Module, ValidationPipe } from '@nestjs/common';
import { CommonModule } from './common/common.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { MessagesModule } from './messages/messages.module';

@Module({
  imports: [
    CommonModule,
    MessagesModule.register()
  ],
})
export class AppModule {
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
