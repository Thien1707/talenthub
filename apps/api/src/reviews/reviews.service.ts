import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ApplicationStatus,
  ModerationTargetType,
  ReviewStatus,
  UserRole,
} from '@prisma/client';
import { assertStaffOrAdmin } from '../common/utils/staff-access.util';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { ModerateReviewDto } from './dto/moderate-review.dto';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(reviewerUserId: bigint, dto: CreateReviewDto) {
    if (BigInt(dto.reviewedUserId) === reviewerUserId) {
      throw new BadRequestException('Không thể tự đánh giá');
    }

    if (dto.applicationId) {
      const app = await this.prisma.application.findFirst({
        where: {
          applicationId: BigInt(dto.applicationId),
          studentUserId: reviewerUserId,
          status: ApplicationStatus.HIRED,
        },
        include: { job: { include: { company: true } } },
      });
      if (!app) {
        throw new ForbiddenException(
          'Chỉ đánh giá sau khi được tuyển (HIRED) cho hồ sơ của bạn',
        );
      }
      if (app.job.company.userId.toString() !== dto.reviewedUserId) {
        throw new BadRequestException('Đánh giá không khớp công ty ứng tuyển');
      }
    }

    return this.prisma.review.create({
      data: {
        reviewerUserId,
        reviewedUserId: BigInt(dto.reviewedUserId),
        applicationId: dto.applicationId ? BigInt(dto.applicationId) : null,
        rating: dto.rating,
        comment: dto.comment,
        status: ReviewStatus.PENDING,
      },
    });
  }

  listPendingStaff(role: UserRole) {
    assertStaffOrAdmin(role);
    return this.prisma.review.findMany({
      where: { status: ReviewStatus.PENDING },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        reviewer: { select: { fullName: true, email: true } },
        reviewed: { select: { fullName: true, email: true } },
      },
    });
  }

  async moderate(
    staffId: bigint,
    role: UserRole,
    reviewId: bigint,
    dto: ModerateReviewDto,
  ) {
    assertStaffOrAdmin(role);
    const review = await this.prisma.review.findUnique({
      where: { reviewId },
    });
    if (!review) throw new NotFoundException('Không tìm thấy đánh giá');

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.review.update({
        where: { reviewId },
        data: {
          status: dto.status,
          moderatedBy: staffId,
        },
      });
      await tx.moderationLog.create({
        data: {
          actorId: staffId,
          targetType: ModerationTargetType.REVIEW,
          targetId: reviewId,
          action:
            dto.status === ReviewStatus.PUBLISHED
              ? 'REVIEW_PUBLISH'
              : 'REVIEW_HIDE',
          beforeData: { status: review.status },
          afterData: { status: dto.status },
        },
      });
      return updated;
    });
  }
}
