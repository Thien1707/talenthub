import { ApiPropertyOptional } from '@nestjs/swagger';
import { Gender, WorkScheduleType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  Min,
} from 'class-validator';

export class UpdateStudentProfileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  dateOfBirth?: Date;

  @ApiPropertyOptional({ enum: Gender })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  district?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ward?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  province?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  preferredAddress?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  preferredProvince?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  preferredDistrict?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  preferredWard?: string;

  @ApiPropertyOptional({ enum: WorkScheduleType })
  @IsOptional()
  @IsEnum(WorkScheduleType)
  workScheduleType?: WorkScheduleType;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  availableFromDate?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  educationLevel?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  schoolName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  major?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1950)
  @Max(2100)
  graduationYear?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  experienceYears?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  linkedinUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  portfolioUrl?: string;
}
