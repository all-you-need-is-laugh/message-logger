import { RedisModule, RedisModuleOptions } from '@liaoliaots/nestjs-redis';
import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import appConfig from './config/app.config';
import redisConfig from './config/redis.config';
import { LockService } from './lock/lock.service';

@Global()
@Module({
  imports: [
    RedisModule.forRootAsync({
      imports: [ ConfigModule.forFeature(redisConfig) ],
      inject: [ redisConfig.KEY ],
      useFactory: (config: ConfigType<typeof redisConfig>): RedisModuleOptions => ({ config })
    }),
    ConfigModule.forRoot({
      envFilePath: [ ...(appConfig().environment ? [ `.env.${appConfig().environment}` ] : []), '.env' ]
    }),
  ],
  providers: [ LockService ],
  exports: [
    LockService,
    RedisModule,
    ConfigModule
  ]
})
export class CommonModule {}
