import { ReviewStatus } from '@prisma/client';
import { IsIn } from 'class-validator';

export class ModerateReviewDto {
  @IsIn([ReviewStatus.PUBLISHED, ReviewStatus.HIDDEN])
  status: 'PUBLISHED' | 'HIDDEN';
}
