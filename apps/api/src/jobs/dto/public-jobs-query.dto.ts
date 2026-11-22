import { ApiPropertyOptional } from '@nestjs/swagger';
import { WorkScheduleType, WorkDayOfWeek } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsOptional, IsString, Matches } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class PublicJobsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Từ khóa tìm việc' })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({ description: 'Alias của keyword (URL)' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  province?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ward?: string;

  @ApiPropertyOptional({ enum: WorkScheduleType })
  @IsOptional()
  @IsEnum(WorkScheduleType)
  jobType?: WorkScheduleType;

  @ApiPropertyOptional({ enum: WorkDayOfWeek })
  @IsOptional()
  @IsEnum(WorkDayOfWeek)
  dayOfWeek?: WorkDayOfWeek;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  startTime?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  endTime?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  salaryMin?: number;
}
