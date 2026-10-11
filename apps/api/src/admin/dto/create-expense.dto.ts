import { Type } from 'class-transformer';
import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class CreateExpenseDto {
  @IsString()
  @MinLength(2)
  expenseCode: string;

  @IsString()
  category: string;

  @IsString()
  @MinLength(3)
  description: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amount: number;

  @IsDateString()
  expenseDate: string;

  @IsOptional()
  @IsString()
  vendorName?: string;
}
