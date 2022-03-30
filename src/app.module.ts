import { RedisModule, RedisModuleOptions } from '@liaoliaots/nestjs-redis';
import { INestApplication, Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { CommonModule } from './common/common.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import appConfig from './config/app.config';
import redisConfig from './config/redis.config';
import { MessagesModule } from './messages/messages.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: [ ...(appConfig().environment ? [ `.env.${appConfig().environment}` ] : []), '.env' ],
    }),
    CommonModule,
    MessagesModule.register(),
    RedisModule.forRootAsync({
      imports: [ ConfigModule.forFeature(redisConfig) ],
      inject: [ redisConfig.KEY ],
      useFactory: (config: ConfigType<typeof redisConfig>): RedisModuleOptions => ({ config })
    })
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
