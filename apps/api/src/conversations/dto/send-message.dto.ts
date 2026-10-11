import { IsOptional, IsString, MaxLength } from 'class-validator';

export class SendMessageDto {
  @IsOptional()
  @IsString()
  @MaxLength(8000)
  content?: string;

  @IsOptional()
  @IsString()
  assetId?: string;
}
