import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

class CvChatMessageDto {
  @ApiProperty({ enum: ['user', 'assistant'] })
  @IsIn(['user', 'assistant'])
  role!: 'user' | 'assistant';

  @ApiProperty()
  @IsString()
  @MaxLength(12_000)
  content!: string;
}

export class CvBuildChatDto {
  @ApiPropertyOptional({ description: 'Phiên bản CV (kiểm tra quyền)' })
  @IsOptional()
  @IsString()
  cvVersionId?: string;

  @ApiProperty({ type: [CvChatMessageDto] })
  @IsArray()
  @ArrayMaxSize(24)
  @ValidateNested({ each: true })
  @Type(() => CvChatMessageDto)
  messages!: CvChatMessageDto[];

  @ApiProperty({ description: 'CV hiện tại trên editor' })
  @IsObject()
  currentContent!: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Tin tuyển dụng đang nhắm (nếu có)' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  jobTitle?: string;
}
