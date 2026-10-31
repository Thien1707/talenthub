import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ChatGateway } from './chat.gateway';
import {
  CHAT_EVENTS,
  type ChatConversationEventPayload,
  type ChatMessageCreatedPayload,
} from './chat.events';

/** Tránh inject ChatGateway vào ConversationsService (vòng phụ thuộc làm hỏng @WebSocketServer). */
@Injectable()
export class ChatRealtimeListener {
  constructor(private readonly chatGateway: ChatGateway) {}

  @OnEvent(CHAT_EVENTS.MESSAGE_CREATED)
  onMessageCreated(data: ChatMessageCreatedPayload) {
    this.chatGateway.broadcastMessage(data.conversationId, data.message);
  }

  @OnEvent(CHAT_EVENTS.CONVERSATION_EVENT)
  onConversationEvent(data: ChatConversationEventPayload) {
    this.chatGateway.broadcastConversationEvent(
      data.conversationId,
      data.event,
      data.payload,
    );
  }
}
