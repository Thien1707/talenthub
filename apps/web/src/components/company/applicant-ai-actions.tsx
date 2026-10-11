"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api/client";

export function ApplicantAiActions({
  applicationId,
  cvVersionId,
  jobId,
}: {
  applicationId: string;
  cvVersionId: string;
  jobId: string;
}) {
  const qc = useQueryClient();

  const { data: analysis, isLoading } = useQuery({
    queryKey: ["ai", "application", applicationId],
    queryFn: async () => {
      const { data } = await api.get<{
        analysisId: string;
        score?: string | number;
        analysisResult?: { summary?: string };
      } | null>(`/ai/applications/${applicationId}/analysis`);
      return data;
    },
  });

  const run = useMutation({
    mutationFn: () =>
      api.post("/ai/analyses/job-match", { cvVersionId, jobId }),
    onSuccess: () => {
      toast.success("Đã phân tích ứng viên (AI)");
      void qc.invalidateQueries({
        queryKey: ["ai", "application", applicationId],
      });
    },
    onError: () => toast.error("Phân tích AI thất bại"),
  });

  const score =
    analysis?.score != null ? Number(analysis.score).toFixed(0) : null;

  return (
    <div className="w-full min-w-[140px] text-sm">
      {isLoading && <span className="text-slate-500">AI…</span>}
      {!isLoading && analysis && (
        <p className="text-violet-800">
          Điểm AI: <strong>{score ?? "—"}</strong>
          {analysis.analysisResult?.summary && (
            <span className="mt-1 block text-xs text-slate-600 line-clamp-2">
              {analysis.analysisResult.summary}
            </span>
          )}
        </p>
      )}
      {!isLoading && !analysis && (
        <button
          type="button"
          disabled={run.isPending}
          onClick={() => run.mutate()}
          className="text-violet-700 hover:underline disabled:opacity-60"
        >
          {run.isPending && (
            <Loader2 className="mr-1 inline h-3 w-3 animate-spin" />
          )}
          Phân tích AI
        </button>
      )}
    </div>
  );
}
