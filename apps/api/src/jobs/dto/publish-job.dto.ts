import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PromotionFeatureCode } from '@prisma/client';
import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class PublishJobQuoteQueryDto {
  @ApiPropertyOptional({ enum: PromotionFeatureCode, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(PromotionFeatureCode, { each: true })
  promotions?: PromotionFeatureCode[];
}

export class PublishJobDto {
  @ApiProperty({ description: 'UUID / unique key chống trừ tiền trùng' })
  @IsString()
  @IsNotEmpty()
  idempotencyKey: string;

  @ApiPropertyOptional({ enum: PromotionFeatureCode, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(PromotionFeatureCode, { each: true })
  promotionCodes?: PromotionFeatureCode[];
}
