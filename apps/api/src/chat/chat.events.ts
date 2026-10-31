export const CHAT_EVENTS = {
  MESSAGE_CREATED: 'chat.message.created',
  CONVERSATION_EVENT: 'chat.conversation.event',
} as const;

export type ChatMessageCreatedPayload = {
  conversationId: string;
  message: unknown;
};

export type ChatConversationEventPayload = {
  conversationId: string;
  event: string;
  payload: unknown;
};
