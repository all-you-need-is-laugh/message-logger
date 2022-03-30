import { RedisModule } from '@liaoliaots/nestjs-redis';
import { Global, Module } from '@nestjs/common';
import { LockService } from './lock/lock.service';

@Global()
@Module({
  imports: [
    // TODO: Read Redis config from config
    RedisModule.forRoot({
      config: {
        host: 'localhost',
        port: 6379,
      }
    })
  ],
  providers: [ LockService ],
  exports: [ LockService ]
})
export class CommonModule {}
