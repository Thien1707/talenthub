import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type CreateNotificationInput = {
  userId: bigint;
  notificationType: string;
  title: string;
  content: string;
  referenceType?: string;
  referenceId?: bigint;
};

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  create(input: CreateNotificationInput) {
    return this.prisma.notification.create({
      data: {
        userId: input.userId,
        notificationType: input.notificationType,
        title: input.title,
        content: input.content,
        referenceType: input.referenceType ?? null,
        referenceId: input.referenceId ?? null,
      },
    });
  }

  listForUser(userId: bigint, limit = 40) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  unreadCount(userId: bigint) {
    return this.prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  async markRead(userId: bigint, notificationId: bigint) {
    const row = await this.prisma.notification.findFirst({
      where: { notificationId, userId },
    });
    if (!row) return { success: false };
    await this.prisma.notification.update({
      where: { notificationId },
      data: { isRead: true, readAt: new Date() },
    });
    return { success: true };
  }

  markAllRead(userId: bigint) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
  }
}
