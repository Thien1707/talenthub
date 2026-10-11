import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateApplicationDto {
  @ApiProperty()
  @IsString()
  jobId: string;

  @ApiProperty()
  @IsString()
  cvVersionId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  coverLetter?: string;
}
