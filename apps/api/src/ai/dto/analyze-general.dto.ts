import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AnalyzeGeneralDto {
  @IsString()
  @IsNotEmpty()
  cvVersionId: string;

  @IsOptional()
  @IsBoolean()
  forceRefresh?: boolean;
}
