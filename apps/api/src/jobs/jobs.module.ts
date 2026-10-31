import { Module } from '@nestjs/common';
import { PostingModule } from '../posting/posting.module';
import { WalletModule } from '../wallet/wallet.module';
import { JobPublishService } from './job-publish.service';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';

@Module({
  imports: [PostingModule, WalletModule],
  controllers: [JobsController],
  providers: [JobsService, JobPublishService],
  exports: [JobsService, JobPublishService],
})
export class JobsModule {}
