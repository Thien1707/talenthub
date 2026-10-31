import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class CreateWalletTopUpDto {
  @ApiProperty({ example: 100000, description: 'Số tiền nạp VND (tối thiểu 5.000)' })
  @Type(() => Number)
  @IsInt()
  @Min(5000)
  amountVnd: number;
}
