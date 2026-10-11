import { VerificationStatus } from '@prisma/client';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class VerifyCompanyDto {
  @IsIn([VerificationStatus.VERIFIED, VerificationStatus.REJECTED])
  status: 'VERIFIED' | 'REJECTED';

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string;
}
