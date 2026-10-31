import { Module } from '@nestjs/common';
import { PostingFeeService } from './posting-fee.service';

@Module({
  providers: [PostingFeeService],
  exports: [PostingFeeService],
})
export class PostingModule {}
