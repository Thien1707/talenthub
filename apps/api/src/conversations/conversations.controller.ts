import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { MessagesQueryDto } from './dto/messages-query.dto';
import { OpenDirectDto } from './dto/open-direct.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { ConversationsService } from './conversations.service';

const CHAT_ROLES = [
  UserRole.STUDENT,
  UserRole.COMPANY,
  UserRole.STAFF,
  UserRole.SUPER_ADMIN,
] as const;

@ApiTags('conversations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Get('me')
  @Roles(...CHAT_ROLES)
  @ApiOperation({ summary: 'Hội thoại của tôi' })
  listMine(@CurrentUser() user: { userId: string }) {
    return this.conversationsService.listMine(BigInt(user.userId));
  }

  @Get('partners/search')
  @Roles(...CHAT_ROLES)
  @ApiOperation({ summary: 'Tìm người dùng để chat DIRECT' })
  searchPartners(
    @CurrentUser() user: { userId: string },
    @Query('q') q: string,
  ) {
    return this.conversationsService.searchChatPartners(
      BigInt(user.userId),
      q ?? '',
    );
  }

  @Post('direct')
  @Roles(...CHAT_ROLES)
  @ApiOperation({ summary: 'Mở hội thoại DIRECT với người dùng khác' })
  openDirect(
    @CurrentUser() user: { userId: string },
    @Body() dto: OpenDirectDto,
  ) {
    return this.conversationsService.openDirect(
      BigInt(user.userId),
      BigInt(dto.otherUserId),
    );
  }

  @Post('application/:applicationId')
  @Roles(UserRole.STUDENT, UserRole.COMPANY)
  @ApiOperation({ summary: 'Mở hội thoại theo hồ sơ ứng tuyển' })
  openApplication(
    @CurrentUser() user: { userId: string; role: UserRole },
    @Param('applicationId') applicationId: string,
  ) {
    return this.conversationsService.openForApplication(
      BigInt(user.userId),
      user.role,
      BigInt(applicationId),
    );
  }

  @Get(':conversationId/messages')
  @Roles(...CHAT_ROLES)
  @ApiOperation({ summary: 'Tin nhắn trong hội thoại (phân trang)' })
  messages(
    @CurrentUser() user: { userId: string },
    @Param('conversationId') conversationId: string,
    @Query() query: MessagesQueryDto,
  ) {
    return this.conversationsService.getMessages(
      BigInt(user.userId),
      BigInt(conversationId),
      query.limit ?? 40,
      query.before ? BigInt(query.before) : undefined,
    );
  }

  @Post(':conversationId/messages')
  @Roles(...CHAT_ROLES)
  @ApiOperation({ summary: 'Gửi tin nhắn' })
  send(
    @CurrentUser() user: { userId: string },
    @Param('conversationId') conversationId: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.conversationsService.sendMessage(
      BigInt(user.userId),
      BigInt(conversationId),
      dto,
    );
  }

  @Patch(':conversationId/messages/:messageId')
  @Roles(...CHAT_ROLES)
  @ApiOperation({ summary: 'Sửa tin nhắn của bạn' })
  editMessage(
    @CurrentUser() user: { userId: string },
    @Param('conversationId') conversationId: string,
    @Param('messageId') messageId: string,
    @Body() dto: UpdateMessageDto,
  ) {
    return this.conversationsService.editMessage(
      BigInt(user.userId),
      BigInt(conversationId),
      BigInt(messageId),
      dto.content,
    );
  }

  @Delete(':conversationId/messages/:messageId')
  @Roles(...CHAT_ROLES)
  @ApiOperation({ summary: 'Thu hồi tin nhắn của bạn' })
  deleteMessage(
    @CurrentUser() user: { userId: string },
    @Param('conversationId') conversationId: string,
    @Param('messageId') messageId: string,
  ) {
    return this.conversationsService.deleteMessage(
      BigInt(user.userId),
      BigInt(conversationId),
      BigInt(messageId),
    );
  }

  @Post(':conversationId/read')
  @Roles(...CHAT_ROLES)
  @ApiOperation({ summary: 'Đánh dấu đã đọc hội thoại' })
  markRead(
    @CurrentUser() user: { userId: string },
    @Param('conversationId') conversationId: string,
  ) {
    return this.conversationsService.markRead(
      BigInt(user.userId),
      BigInt(conversationId),
    );
  }
}
