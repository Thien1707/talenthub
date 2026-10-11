import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreatePostOrderDto {
  @ApiProperty({ description: 'ID tin tuyển dụng cần thanh toán' })
  @IsString()
  jobId: string;
}
