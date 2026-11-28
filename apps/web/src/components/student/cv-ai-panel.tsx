"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Send, Sparkles, X } from "lucide-react";
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
  analysisResult?: AnalysisResult | null;
  summary?: string | null;
  strengths?: string[] | null;
  weaknesses?: string[] | null;
  recommendations?: string[] | null;
  cvVersion?: {
    versionNumber: number;
    cv: { cvName: string };
    fileAsset?: { originalFilename?: string | null } | null;
  };
  job?: { title?: string; slug?: string } | null;
  createdAt: string;
};

type AnalysisResult = {
  summary?: string;
  strengths?: string[];
  weaknesses?: string[];
  recommendations?: string[];
};

function AnalysisDetailDialog({
  row,
  onClose,
}: {
  row: AnalysisRow;
  onClose: () => void;
}) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["ai", "analysis", row.analysisId],
    queryFn: async () => {
      const { data } = await api.get<AnalysisRow>(
        `/ai/analyses/${row.analysisId}`,
      );
      return data;
    },
  });
  const result =
    data?.analysisResult ??
    (data
      ? {
          summary: data.summary ?? undefined,
          strengths: data.strengths ?? undefined,
          weaknesses: data.weaknesses ?? undefined,
          recommendations: data.recommendations ?? undefined,
        }
      : undefined);
  const sections: { key: keyof AnalysisResult; title: string }[] = [
    { key: "summary", title: "Nhận xét tổng quan" },
    { key: "strengths", title: "Điểm mạnh" },
    { key: "weaknesses", title: "Điểm cần cải thiện" },
    { key: "recommendations", title: "Đề xuất" },
  ];
  const cvLabel =
    data?.cvVersion?.fileAsset?.originalFilename ||
    data?.cvVersion?.cv.cvName ||
    row.cvVersion?.fileAsset?.originalFilename ||
    row.cvVersion?.cv.cvName ||
    "CV";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="cv-analysis-title"
        className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 p-5">
          <div className="min-w-0">
            <h2
              id="cv-analysis-title"
              className="text-lg font-bold text-slate-900"
            >
              Chi tiết phân tích CV
            </h2>
            <p className="mt-1 break-words text-sm text-slate-600">{cvLabel}</p>
            <p className="mt-1 text-xs text-slate-500">
              {data?.createdAt
                ? new Date(data.createdAt).toLocaleString("vi-VN")
                : new Date(row.createdAt).toLocaleString("vi-VN")}
              {data?.score != null || row.score != null
                ? ` · ${scoreLabel(data?.score ?? row.score)}`
                : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            aria-label="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5">
          {isLoading && (
            <p className="text-sm text-slate-600">
              Đang tải nội dung phân tích…
            </p>
          )}
          {isError && (
            <p className="text-sm text-red-600">
              Không tải được nội dung chi tiết.
            </p>
          )}
          {data?.status && data.status !== "COMPLETED" && (
            <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
              Trạng thái: {data.status}
            </p>
          )}
          {result &&
            sections.map(({ key, title }) => {
              const value = result[key];
              if (!value || (Array.isArray(value) && value.length === 0))
                return null;
              return (
                <section key={key}>
                  <h3 className="font-semibold text-slate-900">{title}</h3>
                  {Array.isArray(value) ? (
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-slate-700">
                      {value.map((item, index) => (
                        <li key={`${key}-${index}`}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                      {value}
                    </p>
                  )}
                </section>
              );
            })}
          {!isLoading && !isError && !result && (
            <p className="text-sm text-slate-600">
              Chưa có nội dung phân tích.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const WELCOME: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Xin chào! Mình là trợ lý soạn CV. Bạn kể kinh nghiệm, học vấn, kỹ năng — mình sẽ điền lên CV bên phải. Sửa trực tiếp trên CV vẫn được.",
};

function chatStorageKey(cvId: string) {
  return `talenthub:cv-ai-chat:${cvId}`;
}

function loadChatMessages(cvId: string): ChatMessage[] {
  if (typeof sessionStorage === "undefined") return [WELCOME];
  try {
    const raw = sessionStorage.getItem(chatStorageKey(cvId));
    if (!raw) return [WELCOME];
    const parsed = JSON.parse(raw) as ChatMessage[];
    if (!Array.isArray(parsed) || parsed.length === 0) return [WELCOME];
    return parsed;
  } catch {
    return [WELCOME];
  }
}

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

/** Ẩn chi tiết kỹ thuật (Gemini, env…) khỏi UI người dùng. */
function userFacingAiMessage(serverMsg: unknown, fallback: string): string {
  if (typeof serverMsg !== "string" || !serverMsg.trim()) return fallback;
  if (/gemini|GEMINI_API|GEMINI_MODEL/i.test(serverMsg)) return fallback;
  return serverMsg;
}

export function CvAiPanel({
  cvId,
  cvVersionId,
  jobId,
  jobTitle,
  content,
  onApplyContent,
  isUploadCv = false,
}: {
  cvId: string;
  cvVersionId?: string;
  jobId?: string;
  jobTitle?: string;
  content: CvContent;
  onApplyContent: (next: CvContent) => void;
  /** CV tải lên: chỉ phân tích (plain text / PDF), không chat chỉnh builder. */
  isUploadCv?: boolean;
}) {
  const qc = useQueryClient();
  const [mode, setMode] = useState<"chat" | "analyze">(
    isUploadCv ? "analyze" : "chat",
  );
  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    loadChatMessages(cvId),
  );
  const [input, setInput] = useState("");
  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisRow | null>(
    null,
  );
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages(loadChatMessages(cvId));
  }, [cvId]);

  useEffect(() => {
    if (typeof sessionStorage === "undefined") return;
    sessionStorage.setItem(chatStorageKey(cvId), JSON.stringify(messages));
  }, [cvId, messages]);

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
        toast.success("Đã cập nhật và lưu CV");
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
        userFacingAiMessage(
          msg,
          timeout
            ? "Phản hồi quá lâu — thử câu ngắn hơn hoặc gửi lại."
            : "Không gửi được tin nhắn. Thử lại sau.",
        ),
      );
    },
  });

  const general = useMutation({
    mutationFn: () => api.post("/ai/analyses/general", { cvVersionId }),
    onSuccess: (res) => {
      const status = res.data.status;
      toast.success(
        status === "COMPLETED"
          ? "Đã phân tích CV (AI)"
          : "Đang phân tích CV — chờ vài giây…",
      );
      void qc.invalidateQueries({ queryKey: ["ai", "analyses", "me"] });
    },
    onError: () => toast.error("Phân tích thất bại. Thử lại sau."),
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
    onError: () => toast.error("Phân tích độ phù hợp thất bại. Thử lại sau."),
  });

  const send = () => {
    const text = input.trim();
    if (!text || chat.isPending) return;
    chat.mutate(text);
  };

  const pending = general.isPending || jobMatch.isPending;

  return (
    <div className="flex h-full min-h-[320px] flex-col gap-3">
      {!isUploadCv ? (
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
      ) : (
        <p className="text-sm font-medium text-violet-900">
          Phân tích AI cho CV tải lên (PDF/DOC)
        </p>
      )}

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
                Đang soạn gợi ý…
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
            Phân tích CV
          </h2>
          {!cvVersionId ? (
            <p className="mt-2 text-sm text-slate-600">
              Lưu CV một lần để có phiên bản, rồi dùng phân tích.
            </p>
          ) : (
            <>
              <p className="mt-1 text-sm text-slate-600">
                {isUploadCv
                  ? "AI đọc nội dung đã trích từ file CV của bạn — gợi ý cải thiện trước khi ứng tuyển."
                  : "Gợi ý cải thiện — chỉ tham khảo."}
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
                <ul className="mt-4 max-h-72 space-y-2 overflow-y-auto border-t border-violet-200 pt-3 text-sm">
                  {history.map((row, index) => (
                    <li key={row.analysisId}>
                      <button
                        type="button"
                        onClick={() => setSelectedAnalysis(row)}
                        className="w-full rounded-lg p-2 text-left text-slate-800 hover:bg-violet-100/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-600"
                      >
                        <span className="font-medium">
                          {row.cvVersion?.fileAsset?.originalFilename ||
                            row.cvVersion?.cv.cvName ||
                            "CV"}
                        </span>
                        {row.cvVersion?.versionNumber != null && (
                          <span className="ml-1 text-xs text-slate-500">
                            · Phiên bản {row.cvVersion.versionNumber}
                          </span>
                        )}
                        {index === 0 && (
                          <span className="ml-2 rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-800">
                            Mới nhất
                          </span>
                        )}
                        <span className="mt-1 block text-xs text-slate-500">
                          {new Date(row.createdAt).toLocaleString("vi-VN")} ·{" "}
                          {row.analysisType}
                          {row.job?.title ? ` · ${row.job.title}` : ""} ·{" "}
                          {scoreLabel(row.score)} · {row.status}
                        </span>
                        {row.analysisResult?.summary && (
                          <span className="mt-1 block line-clamp-2 text-slate-600">
                            {row.analysisResult.summary}
                          </span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      )}
      {selectedAnalysis && (
        <AnalysisDetailDialog
          row={selectedAnalysis}
          onClose={() => setSelectedAnalysis(null)}
        />
      )}
    </div>
  );
}
