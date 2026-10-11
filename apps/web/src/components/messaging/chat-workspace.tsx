"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Loader2, MessageCirclePlus, Paperclip, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { io, type Socket } from "socket.io-client";
import { api, getStoredAccessToken } from "@/lib/api/client";
import { uploadMedia } from "@/lib/api/upload";
import { MessageAttachmentLink } from "@/components/messaging/message-attachment-link";

type Conversation = {
  conversationId: string;
  conversationType?: string;
  lastMessageAt?: string | null;
  application?: {
    job?: { title?: string };
    student?: { fullName?: string };
  } | null;
  members?: Array<{ user: { fullName: string; userId: string } }>;
};

type Message = {
  messageId: string;
  content?: string | null;
  sentAt: string;
  editedAt?: string | null;
  sender?: { fullName: string; userId: string };
  asset?: {
    assetId?: string;
    secureUrl?: string;
    originalFilename?: string | null;
  } | null;
};

type MessagesPage = {
  items: Message[];
  nextBefore: string | null;
};

type ChatPartner = {
  userId: string;
  fullName: string;
  email: string;
  role: string;
};

function conversationTitle(c: Conversation, myId?: string) {
  const job = c.application?.job?.title;
  const other = c.members?.find((m) => m.user.userId !== myId)?.user.fullName;
  if (job) return `${job} · ${other ?? "Ứng tuyển"}`;
  if (c.conversationType === "DIRECT" && other) {
    return `Chat · ${other}`;
  }
  return `Hội thoại #${c.conversationId}`;
}

export function ChatWorkspace({
  userId,
  initialConversationId,
}: {
  userId?: string;
  initialConversationId?: string;
}) {
  const qc = useQueryClient();
  const [activeId, setActiveId] = useState<string>("");
  const [text, setText] = useState("");
  const [directOpen, setDirectOpen] = useState(false);
  const [partnerQuery, setPartnerQuery] = useState("");
  const [onlineIds, setOnlineIds] = useState<string[]>([]);
  const [typingUserId, setTypingUserId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: conversations, isLoading } = useQuery({
    queryKey: ["conversations", "me"],
    queryFn: async () => {
      const { data } = await api.get<Conversation[]>("/conversations/me");
      return data;
    },
  });

  useEffect(() => {
    if (initialConversationId) {
      setActiveId(initialConversationId);
      return;
    }
    if (conversations?.length && !activeId) {
      setActiveId(conversations[0].conversationId);
    }
  }, [conversations, activeId, initialConversationId]);

  const {
    data: messagePages,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["conversations", activeId, "messages"],
    enabled: !!activeId,
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }) => {
      const { data } = await api.get<MessagesPage>(
        `/conversations/${activeId}/messages`,
        {
          params: {
            limit: 40,
            ...(pageParam ? { before: pageParam } : {}),
          },
        },
      );
      return data;
    },
    getNextPageParam: (last) => last.nextBefore ?? undefined,
  });

  const messages =
    messagePages?.pages
      .slice()
      .reverse()
      .flatMap((p) => [...p.items].reverse()) ?? [];

  const { data: partners } = useQuery({
    queryKey: ["conversations", "partners", partnerQuery],
    enabled: directOpen && partnerQuery.trim().length >= 2,
    queryFn: async () => {
      const { data } = await api.get<ChatPartner[]>(
        "/conversations/partners/search",
        { params: { q: partnerQuery.trim() } },
      );
      return data;
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!activeId) return;
    const token = getStoredAccessToken();
    const apiBase =
      process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";
    const origin = apiBase.replace(/\/api\/v1\/?$/, "");
    const socket = io(`${origin}/chat`, {
      auth: { token },
      transports: ["websocket"],
    });
    socketRef.current = socket;
    socket.emit("join", activeId);
    socket.on("message", (msg: Message) => {
      qc.setQueryData<{ pages: MessagesPage[]; pageParams: unknown[] }>(
        ["conversations", activeId, "messages"],
        (old) => {
          if (!old?.pages?.length) {
            void qc.invalidateQueries({
              queryKey: ["conversations", activeId, "messages"],
            });
            return old;
          }
          const first = old.pages[0]!;
          if (first.items.some((m) => m.messageId === msg.messageId)) {
            return old;
          }
          return {
            ...old,
            pages: [
              { ...first, items: [msg, ...first.items] },
              ...old.pages.slice(1),
            ],
          };
        },
      );
      void qc.invalidateQueries({ queryKey: ["conversations", "me"] });
    });
    socket.on("message_updated", (msg: Message) => {
      qc.setQueryData<{ pages: MessagesPage[]; pageParams: unknown[] }>(
        ["conversations", activeId, "messages"],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((p) => ({
              ...p,
              items: p.items.map((m) =>
                m.messageId === msg.messageId ? { ...m, ...msg } : m,
              ),
            })),
          };
        },
      );
    });
    socket.on(
      "message_deleted",
      (payload: { messageId: string }) => {
        qc.setQueryData<{ pages: MessagesPage[]; pageParams: unknown[] }>(
          ["conversations", activeId, "messages"],
          (old) => {
            if (!old) return old;
            return {
              ...old,
              pages: old.pages.map((p) => ({
                ...p,
                items: p.items.filter((m) => m.messageId !== payload.messageId),
              })),
            };
          },
        );
      },
    );
    socket.on("presence", (payload: { onlineUserIds?: string[] }) => {
      setOnlineIds(payload.onlineUserIds ?? []);
    });
    socket.on(
      "typing",
      (payload: { userId: string; typing: boolean; conversationId: string }) => {
        if (payload.conversationId !== activeId) return;
        if (payload.userId === userId) return;
        setTypingUserId(payload.typing ? payload.userId : null);
      },
    );
    return () => {
      socket.disconnect();
      socketRef.current = null;
      setOnlineIds([]);
      setTypingUserId(null);
    };
  }, [activeId, qc, userId]);

  useEffect(() => {
    if (activeId) {
      void api.post(`/conversations/${activeId}/read`);
    }
  }, [activeId, messages?.length]);

  const emitTyping = (typing: boolean) => {
    if (!activeId || !socketRef.current) return;
    socketRef.current.emit(typing ? "typing_start" : "typing_stop", activeId);
  };

  const openDirect = useMutation({
    mutationFn: (otherUserId: string) =>
      api.post<{ conversationId: string }>("/conversations/direct", {
        otherUserId,
      }),
    onSuccess: (res) => {
      setDirectOpen(false);
      setPartnerQuery("");
      setActiveId(res.data.conversationId);
      void qc.invalidateQueries({ queryKey: ["conversations", "me"] });
      toast.success("Đã mở chat trực tiếp");
    },
    onError: () => toast.error("Không mở được chat"),
  });

  const send = useMutation({
    mutationFn: (payload: { content?: string; assetId?: string }) =>
      api.post<Message>(`/conversations/${activeId}/messages`, payload),
    onSuccess: (res) => {
      setText("");
      emitTyping(false);
      const msg = res.data;
      qc.setQueryData<{ pages: MessagesPage[]; pageParams: unknown[] }>(
        ["conversations", activeId, "messages"],
        (old) => {
          if (!old?.pages?.length) return old;
          const first = old.pages[0]!;
          if (first.items.some((m) => m.messageId === msg.messageId)) {
            return old;
          }
          return {
            ...old,
            pages: [
              { ...first, items: [msg, ...first.items] },
              ...old.pages.slice(1),
            ],
          };
        },
      );
      void qc.invalidateQueries({ queryKey: ["conversations", "me"] });
    },
    onError: () => toast.error("Gửi tin nhắn thất bại"),
  });

  const editMessage = useMutation({
    mutationFn: ({
      messageId,
      content,
    }: {
      messageId: string;
      content: string;
    }) =>
      api.patch<Message>(
        `/conversations/${activeId}/messages/${messageId}`,
        { content },
      ),
    onError: () => toast.error("Không sửa được tin nhắn"),
  });

  const deleteMessage = useMutation({
    mutationFn: (messageId: string) =>
      api.delete(`/conversations/${activeId}/messages/${messageId}`),
    onError: () => toast.error("Không thu hồi được tin nhắn"),
  });

  const attach = useMutation({
    mutationFn: async (file: File) => {
      const asset = await uploadMedia(file, "CHAT_ATTACHMENT");
      await send.mutateAsync({ assetId: asset.assetId, content: text || undefined });
    },
    onError: () => toast.error("Đính kèm thất bại"),
  });

  const active = conversations?.find((c) => c.conversationId === activeId);
  const otherMember = active?.members?.find((m) => m.user.userId !== userId);
  const otherOnline =
    otherMember && onlineIds.includes(otherMember.user.userId);

  return (
    <div className="flex min-h-[480px] flex-col gap-4 md:flex-row">
      <aside className="w-full shrink-0 rounded-xl border bg-white md:w-72">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <p className="text-sm font-semibold text-slate-800">Hội thoại</p>
          <button
            type="button"
            title="Chat trực tiếp"
            onClick={() => setDirectOpen(true)}
            className="rounded p-1 text-blue-700 hover:bg-blue-50"
          >
            <MessageCirclePlus className="h-5 w-5" />
          </button>
        </div>
        {isLoading && (
          <p className="p-3 text-sm text-slate-600">Đang tải...</p>
        )}
        <ul className="max-h-96 overflow-y-auto">
          {conversations?.map((c) => (
            <li key={c.conversationId}>
              <button
                type="button"
                onClick={() => setActiveId(c.conversationId)}
                className={`w-full px-3 py-2 text-left text-sm hover:bg-slate-50 ${
                  activeId === c.conversationId ? "bg-blue-50" : ""
                }`}
              >
                {conversationTitle(c, userId)}
              </button>
            </li>
          ))}
        </ul>
        {!isLoading && conversations?.length === 0 && (
          <p className="p-3 text-sm text-slate-600">
            Chưa có hội thoại. Dùng nút + để chat trực tiếp hoặc mở từ ứng tuyển.
          </p>
        )}
      </aside>

      {directOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-4 shadow-lg">
            <h3 className="font-semibold text-slate-900">Chat trực tiếp</h3>
            <p className="mt-1 text-sm text-slate-600">
              Tìm theo tên hoặc email (tối thiểu 2 ký tự)
            </p>
            <input
              className="mt-3 w-full rounded-lg border px-3 py-2 text-slate-900"
              placeholder="vd: company@..."
              value={partnerQuery}
              onChange={(e) => setPartnerQuery(e.target.value)}
              autoFocus
            />
            <ul className="mt-2 max-h-48 overflow-y-auto">
              {partners?.map((p) => (
                <li key={p.userId}>
                  <button
                    type="button"
                    disabled={openDirect.isPending}
                    className="w-full rounded px-2 py-2 text-left text-sm hover:bg-slate-50"
                    onClick={() => openDirect.mutate(p.userId)}
                  >
                    <span className="font-medium">{p.fullName}</span>
                    <span className="block text-xs text-slate-500">
                      {p.email} · {p.role}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <button
              type="button"
              className="mt-3 w-full rounded-lg border py-2 text-sm"
              onClick={() => {
                setDirectOpen(false);
                setPartnerQuery("");
              }}
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      <section className="flex flex-1 flex-col rounded-xl border bg-white">
        <div className="border-b px-4 py-2">
          <p className="font-medium text-slate-900">
            {active ? conversationTitle(active, userId) : "Chọn hội thoại"}
          </p>
          {otherMember && (
            <p className="text-xs text-slate-500">
              {otherOnline ? "● Đang trực tuyến" : "○ Ngoại tuyến"}
              {typingUserId === otherMember.user.userId && " · đang gõ…"}
            </p>
          )}
        </div>
        <div className="flex-1 space-y-2 overflow-y-auto p-4">
          {hasNextPage && (
            <button
              type="button"
              disabled={isFetchingNextPage}
              className="mx-auto block text-xs text-blue-700 hover:underline"
              onClick={() => void fetchNextPage()}
            >
              {isFetchingNextPage ? "Đang tải…" : "Tải tin cũ hơn"}
            </button>
          )}
          {messages.map((m) => {
            const mine = m.sender?.userId === userId;
            return (
              <div
                key={m.messageId}
                className={`group max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                  mine ? "ml-auto bg-blue-700 text-white" : "bg-slate-100 text-slate-900"
                }`}
              >
                {!mine && (
                  <p className="text-xs font-medium opacity-80">
                    {m.sender?.fullName}
                  </p>
                )}
                {m.content && <p className="whitespace-pre-wrap">{m.content}</p>}
                {m.editedAt && (
                  <p className={`text-[10px] ${mine ? "text-blue-200" : "text-slate-500"}`}>
                    (đã sửa)
                  </p>
                )}
                {m.asset?.assetId && (
                  <MessageAttachmentLink
                    assetId={m.asset.assetId}
                    label={m.asset.originalFilename ?? "Tệp đính kèm"}
                    className={mine ? "text-blue-100" : "text-blue-700"}
                  />
                )}
                {mine && m.content && (
                  <div className="mt-1 flex gap-2 opacity-0 group-hover:opacity-100">
                    <button
                      type="button"
                      className="text-[10px] underline"
                      onClick={() => {
                        const next = window.prompt("Sửa tin nhắn", m.content ?? "");
                        if (next?.trim()) {
                          editMessage.mutate({
                            messageId: m.messageId,
                            content: next.trim(),
                          });
                        }
                      }}
                    >
                      Sửa
                    </button>
                    <button
                      type="button"
                      className="text-[10px] underline"
                      onClick={() => {
                        if (window.confirm("Thu hồi tin nhắn?")) {
                          deleteMessage.mutate(m.messageId);
                        }
                      }}
                    >
                      Thu hồi
                    </button>
                  </div>
                )}
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
        {activeId && (
          <form
            className="flex gap-2 border-t p-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (!text.trim()) return;
              send.mutate({ content: text.trim() });
            }}
          >
            <label className="cursor-pointer rounded-lg border px-2 py-2 text-slate-700 hover:bg-slate-50">
              <Paperclip className="h-4 w-4" />
              <input
                type="file"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) attach.mutate(f);
                  e.target.value = "";
                }}
              />
            </label>
            <input
              className="flex-1 rounded-lg border px-3 py-2 text-slate-900"
              placeholder="Nhập tin nhắn..."
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                emitTyping(true);
                if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
                typingTimerRef.current = setTimeout(() => emitTyping(false), 1200);
              }}
              onBlur={() => emitTyping(false)}
            />
            <button
              type="submit"
              disabled={send.isPending}
              className="flex items-center gap-1 rounded-lg bg-blue-700 px-3 py-2 text-white disabled:opacity-60"
            >
              {send.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
