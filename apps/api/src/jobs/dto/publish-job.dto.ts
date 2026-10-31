import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PromotionFeatureCode } from '@prisma/client';
import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { PromotionFeatureCodeEnum } from '../../common/enums/promotion-feature-code.enum';

export class PublishJobQuoteQueryDto {
  @ApiPropertyOptional({ enum: PromotionFeatureCodeEnum, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(PromotionFeatureCodeEnum, { each: true })
  promotions?: PromotionFeatureCode[];
}

export class PublishJobDto {
  @ApiProperty({ description: 'UUID / unique key chống trừ tiền trùng' })
  @IsString()
  @IsNotEmpty()
  idempotencyKey: string;

  @ApiPropertyOptional({ enum: PromotionFeatureCodeEnum, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(PromotionFeatureCodeEnum, { each: true })
  promotionCodes?: PromotionFeatureCode[];
}
