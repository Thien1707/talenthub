import { AssetType } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UploadMediaQueryDto {
  @IsEnum(AssetType)
  assetType: AssetType;
}
