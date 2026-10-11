import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateStaffDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  @MinLength(2)
  fullName: string;

  @IsString()
  employeeCode: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsString()
  position?: string;
}
