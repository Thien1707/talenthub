import { Injectable } from '@nestjs/common';
import { ModerationTargetType, UserRole } from '@prisma/client';
import { assertStaffOrAdmin } from '../common/utils/staff-access.util';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ModerationService {
  constructor(private readonly prisma: PrismaService) {}

  listLogs(
    role: UserRole,
    query: {
      targetType?: ModerationTargetType;
      page?: number;
      limit?: number;
    },
  ) {
    assertStaffOrAdmin(role);
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 30, 100);
    return this.prisma.moderationLog.findMany({
      where: query.targetType ? { targetType: query.targetType } : undefined,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        actor: { select: { userId: true, fullName: true, role: true } },
      },
    });
  }
}
