import { io, type Socket } from "socket.io-client";
import { getStoredAccessToken } from "@/lib/api/client";

/** Origin API (không có /api/v1) — Socket.IO namespace /chat */
export function getChatSocketOrigin(): string {
  const explicit = process.env.NEXT_PUBLIC_SOCKET_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");

  const apiBase =
    process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";
  return apiBase.replace(/\/api\/v1\/?$/, "");
}

let sharedSocket: Socket | null = null;
let sharedToken: string | null = null;

export type ChatConnectionStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "error";

const statusListeners = new Set<(s: ChatConnectionStatus) => void>();

export function subscribeChatStatus(
  listener: (s: ChatConnectionStatus) => void,
): () => void {
  statusListeners.add(listener);
  return () => statusListeners.delete(listener);
}

function notifyStatus(status: ChatConnectionStatus) {
  statusListeners.forEach((l) => l(status));
}

/** Một kết nối Socket.IO dùng chung — tránh tạo socket mới mỗi lần đổi hội thoại. */
export function getChatSocket(): Socket | null {
  return sharedSocket;
}

export function connectChatSocket(): Socket {
  const token = getStoredAccessToken();
  if (!token) {
    throw new Error("NOT_AUTHENTICATED");
  }

  if (sharedSocket && sharedToken !== token) {
    sharedSocket.disconnect();
    sharedSocket = null;
  }

  if (sharedSocket?.connected) {
    return sharedSocket;
  }

  if (sharedSocket && !sharedSocket.connected) {
    sharedSocket.connect();
    return sharedSocket;
  }

  sharedToken = token;
  const origin = getChatSocketOrigin();
  notifyStatus("connecting");

  sharedSocket = io(`${origin}/chat`, {
    path: "/socket.io",
    auth: { token },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 8000,
    timeout: 20_000,
  });

  sharedSocket.on("connect", () => notifyStatus("connected"));
  sharedSocket.on("disconnect", () => notifyStatus("disconnected"));
  sharedSocket.on("connect_error", () => notifyStatus("error"));

  return sharedSocket;
}

export function disconnectChatSocket() {
  sharedSocket?.disconnect();
  sharedSocket = null;
  sharedToken = null;
  notifyStatus("disconnected");
}

export function joinChatConversation(conversationId: string) {
  const socket = connectChatSocket();
  const emitJoin = () => {
    socket.emit("conversation:join", conversationId);
    socket.emit("join", conversationId);
  };
  if (socket.connected) {
    emitJoin();
  } else {
    socket.once("connect", emitJoin);
  }
}

export function leaveChatConversation(conversationId: string) {
  const socket = sharedSocket;
  if (!socket?.connected || !conversationId) return;
  socket.emit("conversation:leave", conversationId);
  socket.emit("leave", conversationId);
}

/** Chuẩn hóa message từ socket (BigInt → string). */
export function normalizeSocketMessage(raw: Record<string, unknown>) {
  const sender = raw.sender as Record<string, unknown> | undefined;
  const asset = raw.asset as Record<string, unknown> | undefined;
  return {
    messageId: String(raw.messageId ?? ""),
    conversationId: String(raw.conversationId ?? ""),
    content: (raw.content as string | null | undefined) ?? null,
    sentAt:
      typeof raw.sentAt === "string"
        ? raw.sentAt
        : new Date(String(raw.sentAt ?? Date.now())).toISOString(),
    editedAt: raw.editedAt
      ? typeof raw.editedAt === "string"
        ? raw.editedAt
        : new Date(String(raw.editedAt)).toISOString()
      : null,
    sender: sender
      ? {
          userId: String(sender.userId ?? ""),
          fullName: String(sender.fullName ?? ""),
        }
      : undefined,
    asset: asset
      ? {
          assetId: asset.assetId != null ? String(asset.assetId) : undefined,
          secureUrl: asset.secureUrl as string | undefined,
          originalFilename: asset.originalFilename as string | null | undefined,
        }
      : null,
  };
}
