import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WorkDayOfWeek, WorkScheduleType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  ValidateNested,
} from 'class-validator';

export class StudentAvailabilitySlotDto {
  @ApiProperty({ enum: WorkDayOfWeek })
  @IsEnum(WorkDayOfWeek)
  dayOfWeek: WorkDayOfWeek;

  @ApiProperty()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  startTime: string;

  @ApiProperty()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  endTime: string;

  @ApiPropertyOptional({ enum: WorkScheduleType })
  @IsOptional()
  @IsEnum(WorkScheduleType)
  workScheduleType?: WorkScheduleType;
}

export class UpdateAvailabilityDto {
  @ApiProperty({ type: [StudentAvailabilitySlotDto] })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => StudentAvailabilitySlotDto)
  slots: StudentAvailabilitySlotDto[];
}
