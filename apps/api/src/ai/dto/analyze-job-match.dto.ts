import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AnalyzeJobMatchDto {
  @IsString()
  @IsNotEmpty()
  cvVersionId: string;

  @IsString()
  @IsNotEmpty()
  jobId: string;

  @IsOptional()
  @IsBoolean()
  forceRefresh?: boolean;
}
