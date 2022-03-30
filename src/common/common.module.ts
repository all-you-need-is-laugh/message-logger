import { Global, Module } from '@nestjs/common';
import { LockService } from './lock/lock.service';

@Global()
@Module({
  providers: [ LockService ],
  exports: [ LockService ]
})
export class CommonModule {}
