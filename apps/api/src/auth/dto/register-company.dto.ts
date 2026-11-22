import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class RegisterCompanyDto {
  @ApiProperty({ example: 'hr@company.com' })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'Mật khẩu tối thiểu 8 ký tự' })
  password: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng nhập họ tên' })
  fullName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng nhập tên công ty' })
  companyName: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  phone?: string;
}
