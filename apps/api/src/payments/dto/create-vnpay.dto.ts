import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateVnpayDto {
  @ApiProperty()
  @IsString()
  orderId: string;

  @ApiProperty({ required: false, description: 'IP client (sandbox)' })
  @IsOptional()
  @IsString()
  ipAddr?: string;
}
