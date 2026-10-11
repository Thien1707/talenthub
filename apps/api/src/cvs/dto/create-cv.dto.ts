import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export class CreateCvDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  cvName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  templateId?: string;

  @ApiPropertyOptional({ description: 'Nội dung CV Builder (JSON)' })
  @IsOptional()
  @IsObject()
  contentJson?: Record<string, unknown>;
}
