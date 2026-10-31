import { Module } from '@nestjs/common';
import { PostingModule } from '../posting/posting.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [PostingModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
