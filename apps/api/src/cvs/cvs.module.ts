import { Module } from '@nestjs/common';
import { MediaModule } from '../media/media.module';
import { CvsController } from './cvs.controller';
import { CvsService } from './cvs.service';

@Module({
  imports: [MediaModule],
  controllers: [CvsController],
  providers: [CvsService],
  exports: [CvsService],
})
export class CvsModule {}
