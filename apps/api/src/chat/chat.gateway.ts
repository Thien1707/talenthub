import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { serializeForJson } from '../common/utils/serialize-response.util';
import { buildCorsOriginOption } from '../config/cors-origins.util';
import { ConversationsService } from '../conversations/conversations.service';

function socketCors(config: ConfigService) {
  const origin = buildCorsOriginOption(config);
  return {
    origin,
    credentials: true,
  };
}

@WebSocketGateway({
  namespace: '/chat',
  cors: { origin: true, credentials: true },
  transports: ['websocket', 'polling'],
  pingInterval: 25_000,
  pingTimeout: 60_000,
})
export class ChatGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  private readonly logger = new Logger(ChatGateway.name);
  /** conversationId -> online userIds (presence UI) */
  private readonly presenceByRoom = new Map<string, Set<string>>();

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly conversations: ConversationsService,
  ) {}

  afterInit() {
    const cors = socketCors(this.config);
    const engine = this.server?.server?.engine ?? this.server?.engine;
    if (engine?.opts) {
      engine.opts.cors = cors;
    }
    this.logger.log('Chat gateway initialized (namespace /chat)');
  }

  async handleConnection(client: Socket) {
    try {
      const token =
        (client.handshake.auth?.token as string | undefined) ??
        client.handshake.headers.authorization?.replace(/^Bearer\s+/i, '');
      if (!token) {
        this.logger.warn('Chat connect rejected: missing token');
        client.disconnect();
        return;
      }
      const payload = await this.jwt.verifyAsync<{ sub: string }>(token, {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      });
      client.data.userId = payload.sub;
      await client.join(`user:${payload.sub}`);

      const conversationIds =
        await this.conversations.listConversationIdsForUser(BigInt(payload.sub));
      for (const id of conversationIds) {
        await client.join(`conv:${id}`);
      }
      client.data.conversationIds = conversationIds;

      this.logger.log(
        `Chat connected userId=${payload.sub} rooms=${conversationIds.length}`,
      );
    } catch {
      this.logger.warn('Chat connect rejected: invalid token');
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId as string | undefined;
    if (!userId) return;
    for (const [room, users] of this.presenceByRoom.entries()) {
      if (users.delete(userId)) {
        if (users.size === 0) {
          this.presenceByRoom.delete(room);
        }
        this.server.to(room).emit('presence', {
          conversationId: room.replace(/^conv:/, ''),
          onlineUserIds: [...users],
        });
      }
    }
  }

  @SubscribeMessage('join')
  async joinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() conversationId: string,
  ) {
    return this.joinConversationRoom(client, conversationId);
  }

  @SubscribeMessage('conversation:join')
  async joinRoomAlias(
    @ConnectedSocket() client: Socket,
    @MessageBody() conversationId: string,
  ) {
    return this.joinConversationRoom(client, conversationId);
  }

  @SubscribeMessage('leave')
  async leaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() conversationId: string,
  ) {
    const userId = client.data.userId as string | undefined;
    if (!userId || !conversationId) return { ok: false };
    const room = `conv:${conversationId}`;
    await client.leave(room);
    const online = this.presenceByRoom.get(room);
    if (online?.delete(userId)) {
      if (online.size === 0) this.presenceByRoom.delete(room);
      this.server.to(room).emit('presence', {
        conversationId,
        onlineUserIds: online ? [...online] : [],
      });
    }
    return { ok: true };
  }

  @SubscribeMessage('conversation:leave')
  leaveRoomAlias(
    @ConnectedSocket() client: Socket,
    @MessageBody() conversationId: string,
  ) {
    return this.leaveRoom(client, conversationId);
  }

  @SubscribeMessage('typing_start')
  typingStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() conversationId: string,
  ) {
    const userId = client.data.userId as string | undefined;
    if (!userId || !conversationId) return;
    client.to(`conv:${conversationId}`).emit('typing', {
      conversationId,
      userId,
      typing: true,
    });
    client.to(`conv:${conversationId}`).emit('typing:start', {
      conversationId,
      userId,
    });
  }

  @SubscribeMessage('typing_stop')
  typingStop(
    @ConnectedSocket() client: Socket,
    @MessageBody() conversationId: string,
  ) {
    const userId = client.data.userId as string | undefined;
    if (!userId || !conversationId) return;
    client.to(`conv:${conversationId}`).emit('typing', {
      conversationId,
      userId,
      typing: false,
    });
    client.to(`conv:${conversationId}`).emit('typing:stop', {
      conversationId,
      userId,
    });
  }

  broadcastMessage(conversationId: string, message: unknown) {
    if (!this.server) {
      this.logger.error(
        'Socket.IO chưa sẵn sàng — không broadcast được tin nhắn',
      );
      return;
    }
    const payload = serializeForJson(message) as Record<string, unknown>;
    if (payload.conversationId === undefined) {
      payload.conversationId = conversationId;
    }
    const room = `conv:${conversationId}`;
    this.server.to(room).emit('message', payload);
    this.server.to(room).emit('message:new', payload);
  }

  broadcastConversationEvent(
    conversationId: string,
    event: string,
    payload: unknown,
  ) {
    if (!this.server) {
      this.logger.error(
        `Socket.IO chưa sẵn sàng — không emit ${event} tới conv:${conversationId}`,
      );
      return;
    }
    const data = serializeForJson(payload);
    const room = `conv:${conversationId}`;
    this.server.to(room).emit(event, data);
    if (event === 'message:updated') {
      this.server.to(room).emit('message_updated', data);
    }
    if (event === 'message:recalled') {
      this.server.to(room).emit('message_recalled', data);
    }
  }

  private async joinConversationRoom(client: Socket, conversationId: string) {
    const userId = client.data.userId as string | undefined;
    if (!userId || !conversationId) return { ok: false };
    try {
      await this.conversations.ensureMemberPublic(
        BigInt(userId),
        BigInt(conversationId),
      );
      const room = `conv:${conversationId}`;
      await client.join(room);

      let online = this.presenceByRoom.get(room);
      if (!online) {
        online = new Set();
        this.presenceByRoom.set(room, online);
      }
      online.add(userId);
      this.server.to(room).emit('presence', {
        conversationId,
        onlineUserIds: [...online],
      });
      return { ok: true, onlineUserIds: [...online] };
    } catch {
      return { ok: false };
    }
  }
}
