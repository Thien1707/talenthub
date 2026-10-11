import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import {
  ConversationType,
  MessageType,
  UserRole,
  UserStatus,
} from '@prisma/client';
import { getCompanyProfileForUser } from '../common/utils/company-access.util';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { ChatGateway } from '../chat/chat.gateway';
import { SendMessageDto } from './dto/send-message.dto';

@Injectable()
export class ConversationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    @Inject(forwardRef(() => ChatGateway))
    private readonly chatGateway: ChatGateway,
  ) {}

  private chatEligibleRoles(): UserRole[] {
    return [
      UserRole.STUDENT,
      UserRole.COMPANY,
      UserRole.STAFF,
      UserRole.SUPER_ADMIN,
    ];
  }

  async searchChatPartners(userId: bigint, query: string) {
    const q = query.trim();
    if (q.length < 2) {
      return [];
    }
    return this.prisma.user.findMany({
      where: {
        userId: { not: userId },
        deletedAt: null,
        status: UserStatus.ACTIVE,
        role: { in: this.chatEligibleRoles() },
        OR: [{ email: { contains: q } }, { fullName: { contains: q } }],
      },
      select: {
        userId: true,
        fullName: true,
        email: true,
        role: true,
      },
      take: 15,
      orderBy: { fullName: 'asc' },
    });
  }

  async listMine(userId: bigint) {
    const memberships = await this.prisma.conversationMember.findMany({
      where: { userId, leftAt: null },
      orderBy: { conversation: { lastMessageAt: 'desc' } },
      include: {
        conversation: {
          include: {
            application: {
              include: {
                job: { select: { title: true, jobId: true } },
                student: { select: { fullName: true, userId: true } },
              },
            },
            members: {
              where: { leftAt: null },
              include: {
                user: { select: { userId: true, fullName: true, role: true } },
              },
            },
          },
        },
      },
      take: 50,
    });
    return memberships.map((m) => m.conversation);
  }

  async openDirect(userId: bigint, otherUserId: bigint) {
    if (userId === otherUserId) {
      throw new BadRequestException('Không thể chat với chính mình');
    }
    const other = await this.prisma.user.findFirst({
      where: {
        userId: otherUserId,
        deletedAt: null,
        role: { in: this.chatEligibleRoles() },
      },
    });
    if (!other) throw new NotFoundException('Người dùng không hợp lệ');

    const mine = await this.prisma.conversationMember.findMany({
      where: {
        userId,
        leftAt: null,
        conversation: { conversationType: ConversationType.DIRECT },
      },
      include: {
        conversation: { include: { members: { where: { leftAt: null } } } },
      },
    });
    const existing = mine.find((m) =>
      m.conversation.members.some((x) => x.userId === otherUserId),
    );
    if (existing) return existing.conversation;

    return this.prisma.$transaction(async (tx) => {
      const conversation = await tx.conversation.create({
        data: {
          conversationType: ConversationType.DIRECT,
          createdBy: userId,
        },
      });
      await tx.conversationMember.createMany({
        data: [
          { conversationId: conversation.conversationId, userId },
          { conversationId: conversation.conversationId, userId: otherUserId },
        ],
      });
      return conversation;
    });
  }

  ensureMemberPublic(userId: bigint, conversationId: bigint) {
    return this.ensureConversationAccess(conversationId, userId);
  }

  async openForApplication(userId: bigint, role: UserRole, applicationId: bigint) {
    const app = await this.prisma.application.findUnique({
      where: { applicationId },
      include: { job: { include: { company: true } } },
    });
    if (!app) throw new NotFoundException('Không tìm thấy hồ sơ ứng tuyển');

    if (role === UserRole.STUDENT) {
      if (app.studentUserId !== userId) {
        throw new ForbiddenException('Không có quyền');
      }
    } else if (role === UserRole.COMPANY) {
      const company = await getCompanyProfileForUser(this.prisma, userId);
      if (app.job.companyId !== company.companyId) {
        throw new ForbiddenException('Không có quyền');
      }
    } else {
      throw new ForbiddenException('Chỉ sinh viên hoặc công ty mới nhắn tin');
    }

    const existing = await this.prisma.conversation.findFirst({
      where: {
        applicationId,
        conversationType: ConversationType.APPLICATION,
      },
    });
    if (existing) {
      await this.ensureApplicationChatMember(existing.conversationId, userId);
      return existing;
    }

    const companyUserId = app.job.company.userId;
    return this.prisma.$transaction(async (tx) => {
      const conversation = await tx.conversation.create({
        data: {
          conversationType: ConversationType.APPLICATION,
          applicationId,
          createdBy: userId,
        },
      });
      await tx.conversationMember.createMany({
        data: [
          { conversationId: conversation.conversationId, userId: app.studentUserId },
          { conversationId: conversation.conversationId, userId: companyUserId },
        ],
      });
      return conversation;
    });
  }

  async getMessages(
    userId: bigint,
    conversationId: bigint,
    limit = 40,
    beforeMessageId?: bigint,
  ) {
    await this.ensureConversationAccess(conversationId, userId);
    const messages = await this.prisma.message.findMany({
      where: {
        conversationId,
        deletedAt: null,
        ...(beforeMessageId ? { messageId: { lt: beforeMessageId } } : {}),
      },
      orderBy: { sentAt: 'desc' },
      take: limit,
      include: {
        sender: { select: { userId: true, fullName: true } },
        asset: {
          select: {
            assetId: true,
            secureUrl: true,
            mimeType: true,
            originalFilename: true,
          },
        },
      },
    });
    const nextBefore =
      messages.length === limit
        ? messages[messages.length - 1]!.messageId.toString()
        : null;
    return { items: messages, nextBefore };
  }

  async editMessage(
    userId: bigint,
    conversationId: bigint,
    messageId: bigint,
    content: string,
  ) {
    await this.ensureConversationAccess(conversationId, userId);
    const trimmed = content.trim();
    if (!trimmed) throw new BadRequestException('Nội dung trống');

    const existing = await this.prisma.message.findFirst({
      where: {
        messageId,
        conversationId,
        senderUserId: userId,
        deletedAt: null,
      },
    });
    if (!existing) throw new NotFoundException('Không tìm thấy tin nhắn');
    if (existing.messageType !== MessageType.TEXT) {
      throw new BadRequestException('Chỉ sửa được tin nhắn văn bản');
    }

    const updated = await this.prisma.message.update({
      where: { messageId },
      data: { content: trimmed, editedAt: new Date() },
      include: {
        sender: { select: { userId: true, fullName: true } },
        asset: {
          select: {
            assetId: true,
            originalFilename: true,
            mimeType: true,
          },
        },
      },
    });

    this.chatGateway.broadcastConversationEvent(
      conversationId.toString(),
      'message_updated',
      updated,
    );
    return updated;
  }

  async deleteMessage(
    userId: bigint,
    conversationId: bigint,
    messageId: bigint,
  ) {
    await this.ensureConversationAccess(conversationId, userId);
    const existing = await this.prisma.message.findFirst({
      where: {
        messageId,
        conversationId,
        senderUserId: userId,
        deletedAt: null,
      },
    });
    if (!existing) throw new NotFoundException('Không tìm thấy tin nhắn');

    const updated = await this.prisma.message.update({
      where: { messageId },
      data: { deletedAt: new Date(), content: null },
    });

    this.chatGateway.broadcastConversationEvent(
      conversationId.toString(),
      'message_deleted',
      { messageId: messageId.toString(), conversationId: conversationId.toString() },
    );
    return updated;
  }

  async sendMessage(
    userId: bigint,
    conversationId: bigint,
    dto: SendMessageDto,
  ) {
    await this.ensureConversationAccess(conversationId, userId);

    const content = dto.content?.trim() ?? '';
    let assetId: bigint | null = null;
    let messageType: MessageType = MessageType.TEXT;

    if (dto.assetId) {
      assetId = BigInt(dto.assetId);
      const asset = await this.prisma.mediaAsset.findFirst({
        where: { assetId, ownerUserId: userId, deletedAt: null },
      });
      if (!asset) {
        throw new ForbiddenException('Tệp đính kèm không hợp lệ');
      }
      messageType = (asset.mimeType?.startsWith('image/') ?? false)
        ? MessageType.IMAGE
        : MessageType.FILE;
    }

    if (!content && !assetId) {
      throw new BadRequestException('Tin nhắn trống');
    }

    const message = await this.prisma.$transaction(async (tx) => {
      const created = await tx.message.create({
        data: {
          conversationId,
          senderUserId: userId,
          messageType,
          content: content || null,
          assetId,
        },
        include: {
          sender: { select: { userId: true, fullName: true } },
          asset: {
            select: {
              assetId: true,
              originalFilename: true,
              mimeType: true,
            },
          },
        },
      });
      await tx.conversation.update({
        where: { conversationId },
        data: { lastMessageAt: new Date() },
      });
      return created;
    });

    const others = await this.prisma.conversationMember.findMany({
      where: { conversationId, userId: { not: userId }, leftAt: null },
    });
    const preview = content.slice(0, 120) || '[Tệp đính kèm]';
    await Promise.all(
      others.map((m) =>
        this.notifications.create({
          userId: m.userId,
          notificationType: 'NEW_MESSAGE',
          title: 'Tin nhắn mới',
          content: preview,
          referenceType: 'CONVERSATION',
          referenceId: conversationId,
        }),
      ),
    );

    this.chatGateway.broadcastMessage(
      conversationId.toString(),
      message,
    );

    return message;
  }

  async markRead(userId: bigint, conversationId: bigint) {
    await this.ensureConversationAccess(conversationId, userId);
    await this.prisma.conversationMember.updateMany({
      where: { conversationId, userId },
      data: { lastReadAt: new Date() },
    });
    return { success: true };
  }

  private async ensureApplicationChatMember(
    conversationId: bigint,
    userId: bigint,
  ) {
    const member = await this.prisma.conversationMember.findFirst({
      where: { conversationId, userId, leftAt: null },
    });
    if (!member) {
      throw new ForbiddenException('Bạn không thuộc hội thoại này');
    }
  }

  private async ensureConversationAccess(
    conversationId: bigint,
    userId: bigint,
  ) {
    const user = await this.prisma.user.findFirst({
      where: { userId, deletedAt: null },
      select: { role: true },
    });
    if (!user) {
      throw new ForbiddenException('Không có quyền');
    }
    if (
      user.role === UserRole.STAFF ||
      user.role === UserRole.SUPER_ADMIN
    ) {
      const exists = await this.prisma.conversation.findFirst({
        where: { conversationId },
      });
      if (!exists) throw new NotFoundException('Không tìm thấy hội thoại');
      return;
    }
    const member = await this.prisma.conversationMember.findFirst({
      where: { conversationId, userId, leftAt: null },
    });
    if (!member) {
      throw new ForbiddenException('Bạn không thuộc hội thoại này');
    }
  }
}
