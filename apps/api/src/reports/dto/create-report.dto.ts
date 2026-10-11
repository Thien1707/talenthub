import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateReportDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  reportType: string;

  @IsString()
  @MinLength(10)
  @MaxLength(5000)
  reason: string;

  @IsOptional()
  @IsString()
  reportedUserId?: string;

  @IsOptional()
  @IsString()
  jobId?: string;

  @IsOptional()
  @IsString()
  messageId?: string;

  @IsOptional()
  @IsString()
  evidenceAssetId?: string;
}
