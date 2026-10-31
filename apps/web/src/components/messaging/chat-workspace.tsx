"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Loader2, MessageCirclePlus, Paperclip, Send } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api/client";
import {
  connectChatSocket,
  joinChatConversation,
  leaveChatConversation,
  normalizeSocketMessage,
  subscribeChatStatus,
  type ChatConnectionStatus,
} from "@/lib/chat-socket";
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
  conversationId?: string;
  content?: string | null;
  sentAt: string;
  editedAt?: string | null;
  isRecalled?: boolean;
  recalledAt?: string | null;
  sender?: { fullName: string; userId: string };
  asset?: {
    assetId?: string;
    secureUrl?: string;
    originalFilename?: string | null;
  } | null;
};

function isMessageRecalled(m: Message) {
  return Boolean(m.isRecalled || m.recalledAt);
}

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
  const activeIdRef = useRef(activeId);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [connStatus, setConnStatus] =
    useState<ChatConnectionStatus>("disconnected");
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [recallTarget, setRecallTarget] = useState<Message | null>(null);

  activeIdRef.current = activeId;

  const upsertMessageInCache = useCallback(
    (conversationId: string, msg: Message) => {
      qc.setQueryData<{ pages: MessagesPage[]; pageParams: unknown[] }>(
        ["conversations", conversationId, "messages"],
        (old) => {
          if (!old?.pages?.length) return old;
          let found = false;
          const pages = old.pages.map((p) => ({
            ...p,
            items: p.items.map((m) => {
              if (m.messageId !== msg.messageId) return m;
              found = true;
              return { ...m, ...msg, conversationId };
            }),
          }));
          if (found) return { ...old, pages };
          return old;
        },
      );
      void qc.invalidateQueries({ queryKey: ["conversations", "me"] });
    },
    [qc],
  );

  function appendMessageToCache(conversationId: string, msg: Message) {
    qc.setQueryData<{ pages: MessagesPage[]; pageParams: unknown[] }>(
      ["conversations", conversationId, "messages"],
      (old) => {
        if (!old?.pages?.length) {
          void qc.invalidateQueries({
            queryKey: ["conversations", conversationId, "messages"],
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
  }

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
    if (!userId) return;
    const unsubStatus = subscribeChatStatus(setConnStatus);
    let socket;
    try {
      socket = connectChatSocket();
    } catch {
      setConnStatus("error");
      return unsubStatus;
    }

    const onIncoming = (raw: Record<string, unknown>) => {
      const msg = normalizeSocketMessage(raw) as Message;
      const convId =
        msg.conversationId ||
        String(raw.conversationId ?? activeIdRef.current ?? "");
      if (!convId) return;
      appendMessageToCache(convId, { ...msg, conversationId: convId });
    };

    const onUpdated = (raw: Record<string, unknown>) => {
      const msg = normalizeSocketMessage(raw) as Message;
      const convId =
        msg.conversationId ||
        String(raw.conversationId ?? activeIdRef.current ?? "");
      if (!convId || !msg.messageId) return;
      upsertMessageInCache(convId, { ...msg, conversationId: convId });
    };

    const onRecalled = (raw: Record<string, unknown>) => {
      const msg = normalizeSocketMessage(raw) as Message;
      const convId =
        msg.conversationId ||
        String(raw.conversationId ?? activeIdRef.current ?? "");
      if (!convId || !msg.messageId) return;
      upsertMessageInCache(convId, {
        ...msg,
        conversationId: convId,
        isRecalled: true,
        content: msg.content ?? "Tin nhắn đã được thu hồi",
        asset: null,
        editedAt: null,
      });
    };

    const onPresence = (payload: {
      conversationId?: string;
      onlineUserIds?: string[];
    }) => {
      if (payload.conversationId !== activeIdRef.current) return;
      setOnlineIds(payload.onlineUserIds ?? []);
    };

    const onTyping = (payload: {
      userId: string;
      typing?: boolean;
      conversationId: string;
    }) => {
      if (payload.conversationId !== activeIdRef.current) return;
      if (payload.userId === userId) return;
      setTypingUserId(payload.typing ? payload.userId : null);
    };

    const onReconnect = () => {
      const id = activeIdRef.current;
      if (id) {
        joinChatConversation(id);
        void qc.invalidateQueries({
          queryKey: ["conversations", id, "messages"],
        });
      }
      void qc.invalidateQueries({ queryKey: ["conversations", "me"] });
    };

    socket.on("message", onIncoming);
    socket.on("message:new", onIncoming);
    socket.on("message:updated", onUpdated);
    socket.on("message_updated", onUpdated);
    socket.on("message:recalled", onRecalled);
    socket.on("message_recalled", onRecalled);
    socket.on("presence", onPresence);
    socket.on("typing", onTyping);
    socket.on("typing:start", (p: { userId: string; conversationId: string }) =>
      onTyping({ ...p, typing: true }),
    );
    socket.on("typing:stop", (p: { userId: string; conversationId: string }) =>
      onTyping({ ...p, typing: false }),
    );
    socket.io.on("reconnect", onReconnect);

    return () => {
      unsubStatus();
      socket.off("message", onIncoming);
      socket.off("message:new", onIncoming);
      socket.off("message:updated", onUpdated);
      socket.off("message_updated", onUpdated);
      socket.off("message:recalled", onRecalled);
      socket.off("message_recalled", onRecalled);
      socket.off("presence", onPresence);
      socket.off("typing", onTyping);
      socket.io.off("reconnect", onReconnect);
    };
  }, [userId, qc, upsertMessageInCache]);

  const prevActiveRef = useRef<string>("");
  useEffect(() => {
    if (!userId || !activeId) return;
    if (prevActiveRef.current && prevActiveRef.current !== activeId) {
      leaveChatConversation(prevActiveRef.current);
    }
    joinChatConversation(activeId);
    prevActiveRef.current = activeId;
    setOnlineIds([]);
    setTypingUserId(null);
  }, [activeId, userId]);

  useEffect(() => {
    if (activeId) {
      void api.post(`/conversations/${activeId}/read`);
    }
  }, [activeId, messages?.length]);

  const emitTyping = (typing: boolean) => {
    if (!activeId) return;
    try {
      const socket = connectChatSocket();
      if (!socket.connected) return;
      socket.emit(typing ? "typing_start" : "typing_stop", activeId);
    } catch {
      /* chưa đăng nhập */
    }
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
      joinChatConversation(res.data.conversationId);
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
      const msg = {
        ...res.data,
        messageId: String(res.data.messageId),
        conversationId: activeId,
      };
      appendMessageToCache(activeId, msg);
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
    onSuccess: (res) => {
      const msg = {
        ...res.data,
        messageId: String(res.data.messageId),
        conversationId: activeId,
      };
      upsertMessageInCache(activeId, msg);
      setEditingMessageId(null);
      setEditDraft("");
      toast.success("Đã lưu tin nhắn");
    },
    onError: () => toast.error("Không sửa được tin nhắn"),
  });

  const recallMessage = useMutation({
    mutationFn: (messageId: string) =>
      api.delete<Message>(`/conversations/${activeId}/messages/${messageId}`),
    onSuccess: (res) => {
      const msg = {
        ...res.data,
        messageId: String(res.data.messageId),
        conversationId: activeId,
        isRecalled: true,
      };
      upsertMessageInCache(activeId, msg);
      setRecallTarget(null);
      toast.success("Đã thu hồi tin nhắn");
    },
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

      {recallTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-4 shadow-lg">
            <h3 className="font-semibold text-slate-900">Thu hồi tin nhắn?</h3>
            <p className="mt-2 text-sm text-slate-600">
              Bạn có chắc chắn muốn thu hồi tin nhắn này không?
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-lg border px-4 py-2 text-sm"
                disabled={recallMessage.isPending}
                onClick={() => setRecallTarget(null)}
              >
                Hủy
              </button>
              <button
                type="button"
                className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white disabled:opacity-60"
                disabled={recallMessage.isPending}
                onClick={() => recallMessage.mutate(recallTarget.messageId)}
              >
                {recallMessage.isPending ? "Đang thu hồi…" : "Thu hồi"}
              </button>
            </div>
          </div>
        </div>
      )}

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
              {connStatus === "connected"
                ? otherOnline
                  ? "● Đang trực tuyến"
                  : "○ Ngoại tuyến"
                : connStatus === "connecting"
                  ? "Đang kết nối chat…"
                  : "Mất kết nối realtime — tin vẫn lưu khi gửi/làm mới"}
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
            const recalled = isMessageRecalled(m);
            const isEditing = editingMessageId === m.messageId;
            return (
              <div
                key={m.messageId}
                className={`group max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                  mine ? "ml-auto bg-blue-700 text-white" : "bg-slate-100 text-slate-900"
                } ${recalled ? "opacity-90" : ""}`}
              >
                {!mine && (
                  <p className="text-xs font-medium opacity-80">
                    {m.sender?.fullName}
                  </p>
                )}
                {isEditing ? (
                  <div className="mt-1 space-y-2">
                    <textarea
                      className="w-full rounded border border-blue-200 bg-white px-2 py-1 text-sm text-slate-900"
                      rows={3}
                      value={editDraft}
                      onChange={(e) => setEditDraft(e.target.value)}
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={editMessage.isPending || !editDraft.trim()}
                        className="rounded bg-white/20 px-2 py-1 text-xs font-medium disabled:opacity-50"
                        onClick={() => {
                          const trimmed = editDraft.trim();
                          if (!trimmed) return;
                          editMessage.mutate({
                            messageId: m.messageId,
                            content: trimmed,
                          });
                        }}
                      >
                        Lưu
                      </button>
                      <button
                        type="button"
                        className="rounded px-2 py-1 text-xs underline"
                        onClick={() => {
                          setEditingMessageId(null);
                          setEditDraft("");
                        }}
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {m.content && (
                      <p
                        className={`whitespace-pre-wrap ${
                          recalled ? "italic opacity-80" : ""
                        }`}
                      >
                        {m.content}
                      </p>
                    )}
                    {m.editedAt && !recalled && (
                      <p
                        className={`text-[10px] ${mine ? "text-blue-200" : "text-slate-500"}`}
                      >
                        Đã chỉnh sửa
                      </p>
                    )}
                    {!recalled && m.asset?.assetId && (
                      <MessageAttachmentLink
                        assetId={m.asset.assetId}
                        label={m.asset.originalFilename ?? "Tệp đính kèm"}
                        className={mine ? "text-blue-100" : "text-blue-700"}
                      />
                    )}
                  </>
                )}
                {mine && !recalled && !isEditing && (m.content || m.asset?.assetId) && (
                  <div className="mt-1 flex gap-3 opacity-0 group-hover:opacity-100">
                    {m.content && (
                      <button
                        type="button"
                        className="text-[10px] underline"
                        onClick={() => {
                          setEditingMessageId(m.messageId);
                          setEditDraft(m.content ?? "");
                        }}
                      >
                        Chỉnh sửa
                      </button>
                    )}
                    <button
                      type="button"
                      className="text-[10px] underline"
                      onClick={() => setRecallTarget(m)}
                    >
                      Thu hồi tin nhắn
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
