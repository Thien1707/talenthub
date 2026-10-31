"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Send, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api/client";
import { mergeWithDefaults } from "@/lib/cv/normalize-content";
import type { CvContent } from "@/lib/cv/types";

type AnalysisRow = {
  analysisId: string;
  analysisType: string;
  status: string;
  score?: string | number | null;
  analysisResult?: { summary?: string } | null;
  job?: { title?: string; slug?: string } | null;
  createdAt: string;
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const WELCOME: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Xin chào! Mình là trợ lý soạn CV. Bạn kể kinh nghiệm, học vấn, kỹ năng — mình sẽ điền lên CV bên phải. Sửa trực tiếp trên CV vẫn được; nhớ bấm Lưu khi xong.",
};

const SUGGESTIONS = [
  "Tạo CV intern lập trình viên, mới tốt nghiệp",
  "Thêm 2 dự án React + Node từ mô tả của tôi",
  "Viết lại phần giới thiệu cho chuyên nghiệp hơn",
  "Gợi ý kỹ năng cho vị trí marketing",
];

function scoreLabel(score: AnalysisRow["score"]) {
  if (score == null || score === "") return "—";
  const n = Number(score);
  return Number.isNaN(n) ? String(score) : `${n.toFixed(0)}/100`;
}

export function CvAiPanel({
  cvVersionId,
  jobId,
  jobTitle,
  content,
  onApplyContent,
}: {
  cvVersionId?: string;
  jobId?: string;
  jobTitle?: string;
  content: CvContent;
  onApplyContent: (next: CvContent) => void;
}) {
  const qc = useQueryClient();
  const [mode, setMode] = useState<"chat" | "analyze">("chat");
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const { data: history } = useQuery({
    queryKey: ["ai", "analyses", "me"],
    queryFn: async () => {
      const { data } = await api.get<AnalysisRow[]>("/ai/analyses/me");
      return data;
    },
    enabled: mode === "analyze",
    refetchInterval: (query) => {
      const rows = query.state.data;
      const busy = rows?.some(
        (r) => r.status === "PROCESSING" || r.status === "PENDING",
      );
      return busy ? 2000 : false;
    },
  });

  const chat = useMutation({
    mutationFn: async (userText: string) => {
      const hist = messages.filter((m) => m.id !== "welcome");
      const nextMessages: ChatMessage[] = [
        ...hist,
        { id: `u-${Date.now()}`, role: "user", content: userText },
      ];
      const { data } = await api.post<{
        message: string;
        content: CvContent;
      }>(
        "/ai/cv/build-chat",
        {
          cvVersionId,
          jobTitle,
          currentContent: content,
          messages: nextMessages.map(({ role, content: c }) => ({
            role,
            content: c,
          })),
        },
        { timeout: 65_000 },
      );
      return { userText, data, nextMessages };
    },
    onSuccess: ({ data, nextMessages }) => {
      setMessages([
        ...nextMessages,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: data.message,
        },
      ]);
      if (data.content) {
        onApplyContent(mergeWithDefaults(data.content));
        toast.success("Đã cập nhật CV — xem preview và bấm Lưu");
      }
      setInput("");
    },
    onError: (err: unknown) => {
      const msg =
        err &&
        typeof err === "object" &&
        "response" in err &&
        (err as { response?: { data?: { message?: string } } }).response?.data
          ?.message;
      const timeout =
        err &&
        typeof err === "object" &&
        "code" in err &&
        (err as { code?: string }).code === "ECONNABORTED";
      toast.error(
        timeout
          ? "Gemini quá lâu — thử câu ngắn hơn hoặc kiểm tra API key"
          : typeof msg === "string"
            ? msg
            : "Chat AI thất bại — kiểm tra GEMINI_API_KEY / GEMINI_MODEL trên API",
      );
    },
  });

  const general = useMutation({
    mutationFn: () =>
      api.post("/ai/analyses/general", { cvVersionId }),
    onSuccess: (res) => {
      const status = res.data.status;
      toast.success(
        status === "COMPLETED"
          ? "Đã phân tích CV (AI)"
          : "Đang phân tích CV — chờ vài giây…",
      );
      void qc.invalidateQueries({ queryKey: ["ai", "analyses", "me"] });
    },
    onError: () =>
      toast.error("Phân tích thất bại — kiểm tra GEMINI_API_KEY"),
  });

  const jobMatch = useMutation({
    mutationFn: () =>
      api.post("/ai/analyses/job-match", { cvVersionId, jobId }),
    onSuccess: (res) => {
      const status = res.data.status;
      toast.success(
        status === "COMPLETED"
          ? "Đã phân tích độ phù hợp tin tuyển dụng"
          : "Đang phân tích — chờ vài giây…",
      );
      void qc.invalidateQueries({ queryKey: ["ai", "analyses", "me"] });
    },
    onError: () => toast.error("Phân tích JOB_MATCH thất bại"),
  });

  const send = () => {
    const text = input.trim();
    if (!text || chat.isPending) return;
    chat.mutate(text);
  };

  const pending = general.isPending || jobMatch.isPending;

  return (
    <div className="flex h-full min-h-[320px] flex-col gap-3">
      <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
        <button
          type="button"
          onClick={() => setMode("chat")}
          className={`flex-1 rounded-md px-2 py-1.5 text-sm font-medium ${
            mode === "chat"
              ? "bg-white text-violet-900 shadow-sm"
              : "text-slate-600"
          }`}
        >
          Trò chuyện
        </button>
        <button
          type="button"
          onClick={() => setMode("analyze")}
          className={`flex-1 rounded-md px-2 py-1.5 text-sm font-medium ${
            mode === "analyze"
              ? "bg-white text-violet-900 shadow-sm"
              : "text-slate-600"
          }`}
        >
          Phân tích
        </button>
      </div>

      {mode === "chat" ? (
        <>
          <div className="flex-1 space-y-3 overflow-y-auto rounded-xl border border-violet-200 bg-white p-3">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[95%] rounded-xl px-3 py-2 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-violet-700 text-white"
                      : "bg-violet-50 text-slate-800"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {chat.isPending && (
              <p className="flex items-center gap-2 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang hỏi Gemini (thường 5–20 giây)…
              </p>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                disabled={chat.isPending}
                onClick={() => setInput(s)}
                className="rounded-full border border-violet-200 bg-violet-50/80 px-2.5 py-1 text-[11px] text-violet-900 hover:bg-violet-100 disabled:opacity-50"
              >
                {s}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <textarea
              rows={2}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="VD: Mình học CNTT năm 3, từng làm intern frontend 3 tháng…"
              className="min-h-[44px] flex-1 resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
            <button
              type="button"
              disabled={chat.isPending || !input.trim()}
              onClick={send}
              className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-lg bg-violet-700 text-white hover:bg-violet-800 disabled:opacity-50"
              aria-label="Gửi"
            >
              {chat.isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </button>
          </div>
        </>
      ) : (
        <div className="rounded-xl border border-violet-200 bg-violet-50/50 p-4">
          <h2 className="flex items-center gap-2 font-semibold text-slate-900">
            <Sparkles className="h-5 w-5 text-violet-600" />
            Phân tích CV (Gemini)
          </h2>
          {!cvVersionId ? (
            <p className="mt-2 text-sm text-slate-600">
              Lưu CV một lần để có phiên bản, rồi dùng phân tích.
            </p>
          ) : (
            <>
              <p className="mt-1 text-sm text-slate-600">
                Gợi ý cải thiện — chỉ tham khảo.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => general.mutate()}
                  className="rounded-lg bg-violet-700 px-3 py-2 text-sm text-white hover:bg-violet-800 disabled:opacity-60"
                >
                  {general.isPending && (
                    <Loader2 className="mr-1 inline h-4 w-4 animate-spin" />
                  )}
                  Phân tích tổng quát
                </button>
                {jobId && (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => jobMatch.mutate()}
                    className="rounded-lg border border-violet-600 px-3 py-2 text-sm text-violet-900 hover:bg-violet-100 disabled:opacity-60"
                  >
                    {jobMatch.isPending && (
                      <Loader2 className="mr-1 inline h-4 w-4 animate-spin" />
                    )}
                    Phù hợp: {jobTitle ?? "tin này"}
                  </button>
                )}
              </div>
              {history && history.length > 0 && (
                <ul className="mt-4 space-y-2 border-t border-violet-200 pt-3 text-sm">
                  {history.slice(0, 5).map((row) => (
                    <li key={row.analysisId} className="text-slate-800">
                      <span className="font-medium">{row.analysisType}</span>
                      {row.job?.title ? ` · ${row.job.title}` : ""} —{" "}
                      <span className="text-violet-800">
                        {scoreLabel(row.score)}
                      </span>{" "}
                      <span className="text-slate-500">({row.status})</span>
                      {row.analysisResult?.summary && (
                        <p className="mt-1 line-clamp-2 text-slate-600">
                          {row.analysisResult.summary}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
