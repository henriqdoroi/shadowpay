import { Global, Module } from '@nestjs/common';
import { PspService } from './psp.service';

@Global()
@Module({
  providers: [PspService],
  exports: [PspService],
})
export class PspModule {}
