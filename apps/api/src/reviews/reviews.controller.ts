import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateReviewDto } from './dto/create-review.dto';
import { ModerateReviewDto } from './dto/moderate-review.dto';
import { ReviewsService } from './reviews.service';

@ApiTags('reviews')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Gửi đánh giá (sau HIRED nếu gắn application)' })
  create(
    @CurrentUser() user: { userId: string },
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewsService.create(BigInt(user.userId), dto);
  }

  @Get('staff/pending')
  @Roles(UserRole.STAFF, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Staff — đánh giá chờ duyệt' })
  pending(@CurrentUser() user: { role: UserRole }) {
    return this.reviewsService.listPendingStaff(user.role);
  }

  @Patch('staff/:reviewId')
  @Roles(UserRole.STAFF, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Staff — duyệt/ẩn đánh giá' })
  moderate(
    @CurrentUser() user: { userId: string; role: UserRole },
    @Param('reviewId') reviewId: string,
    @Body() dto: ModerateReviewDto,
  ) {
    return this.reviewsService.moderate(
      BigInt(user.userId),
      user.role,
      BigInt(reviewId),
      dto,
    );
  }
}
