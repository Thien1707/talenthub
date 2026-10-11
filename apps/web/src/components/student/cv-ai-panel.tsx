"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api/client";

type AnalysisRow = {
  analysisId: string;
  analysisType: string;
  status: string;
  score?: string | number | null;
  analysisResult?: { summary?: string } | null;
  job?: { title?: string; slug?: string } | null;
  createdAt: string;
};

function scoreLabel(score: AnalysisRow["score"]) {
  if (score == null || score === "") return "—";
  const n = Number(score);
  return Number.isNaN(n) ? String(score) : `${n.toFixed(0)}/100`;
}

export function CvAiPanel({
  cvVersionId,
  jobId,
  jobTitle,
}: {
  cvVersionId?: string;
  jobId?: string;
  jobTitle?: string;
}) {
  const qc = useQueryClient();

  const { data: history } = useQuery({
    queryKey: ["ai", "analyses", "me"],
    queryFn: async () => {
      const { data } = await api.get<AnalysisRow[]>("/ai/analyses/me");
      return data;
    },
    refetchInterval: (query) => {
      const rows = query.state.data;
      const busy = rows?.some(
        (r) => r.status === "PROCESSING" || r.status === "PENDING",
      );
      return busy ? 2000 : false;
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

  if (!cvVersionId) {
    return (
      <p className="text-sm text-slate-600">
        Tạo hoặc lưu CV trước khi dùng phân tích AI.
      </p>
    );
  }

  const pending = general.isPending || jobMatch.isPending;

  return (
    <div className="rounded-xl border border-violet-200 bg-violet-50/50 p-4">
      <h2 className="flex items-center gap-2 font-semibold text-slate-900">
        <Sparkles className="h-5 w-5 text-violet-600" />
        Phân tích CV (Gemini)
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        Gợi ý cải thiện CV và điểm phù hợp — chỉ mang tính tham khảo.
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
              <span className="text-violet-800">{scoreLabel(row.score)}</span>{" "}
              <span className="text-slate-500">({row.status})</span>
              {row.analysisResult?.summary && (
                <p className="mt-1 text-slate-600 line-clamp-2">
                  {row.analysisResult.summary}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
