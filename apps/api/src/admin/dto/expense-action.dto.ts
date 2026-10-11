import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ExpenseActionDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string;
}
