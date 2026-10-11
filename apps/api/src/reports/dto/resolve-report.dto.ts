import { ReportStatus } from '@prisma/client';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class ResolveReportDto {
  @IsIn([ReportStatus.RESOLVED, ReportStatus.REJECTED])
  status: 'RESOLVED' | 'REJECTED';

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  resolutionNote?: string;
}
