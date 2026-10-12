import { forwardRef, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import type { ConversationsService } from '../conversations/conversations.service';

@WebSocketGateway({
  cors: {
    origin: true,
    credentials: true,
  },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  /** conversationId -> online userIds */
  private readonly presenceByRoom = new Map<string, Set<string>>();

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    @Inject(forwardRef(() => require('../conversations/conversations.service').ConversationsService))
    private readonly conversations: ConversationsService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        (client.handshake.auth?.token as string | undefined) ??
        client.handshake.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        client.disconnect();
        return;
      }
      const payload = await this.jwt.verifyAsync<{ sub: string }>(token, {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      });
      client.data.userId = payload.sub;
    } catch {
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
    const userId = client.data.userId as string | undefined;
    if (!userId || !conversationId) return;
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

  @SubscribeMessage('typing_start')
  async typingStart(
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
  }

  @SubscribeMessage('typing_stop')
  async typingStop(
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
  }

  broadcastMessage(conversationId: string, message: unknown) {
    this.server.to(`conv:${conversationId}`).emit('message', message);
  }

  broadcastConversationEvent(
    conversationId: string,
    event: string,
    payload: unknown,
  ) {
    this.server.to(`conv:${conversationId}`).emit(event, payload);
  }
}
