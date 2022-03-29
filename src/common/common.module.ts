import { RedisModule } from '@liaoliaots/nestjs-redis';
import { Module } from '@nestjs/common';
import { LockService } from './lock/lock.service';

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
  providers: [ LockService ]
})
export class CommonModule {}
