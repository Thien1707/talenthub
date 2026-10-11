import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString } from 'class-validator';

export class UpdateCvDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cvName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  contentJson?: Record<string, unknown>;
}
