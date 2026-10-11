"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api/client";

type PendingJob = {
  jobId: string;
  title: string;
  location: string;
  jobType: string;
  company?: { companyName: string };
};

export function ModerationPanel() {
  const qc = useQueryClient();
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["moderation", "pending"],
    queryFn: async () => {
      const { data } = await api.get<{ items: PendingJob[] }>(
        "/jobs/moderation/pending",
      );
      return data.items;
    },
  });

  const approve = useMutation({
    mutationFn: (jobId: string) =>
      api.post(`/jobs/moderation/${jobId}/approve`),
    onSuccess: () => {
      toast.success("Đã duyệt tin");
      void qc.invalidateQueries({ queryKey: ["moderation", "pending"] });
    },
    onError: () => toast.error("Duyệt thất bại"),
  });

  const reject = useMutation({
    mutationFn: ({ jobId, reason }: { jobId: string; reason: string }) =>
      api.post(`/jobs/moderation/${jobId}/reject`, { reason }),
    onSuccess: () => {
      toast.success("Đã từ chối tin");
      setRejectId(null);
      setReason("");
      void qc.invalidateQueries({ queryKey: ["moderation", "pending"] });
    },
    onError: () => toast.error("Từ chối thất bại"),
  });

  return (
    <div>
      {isLoading && <p className="text-slate-500">Đang tải hàng đợi...</p>}
      {isError && (
        <p className="text-red-600">Không tải được danh sách chờ duyệt.</p>
      )}
      {!isLoading && !isError && data?.length === 0 && (
        <p className="text-slate-500">Không có tin chờ duyệt.</p>
      )}
      <ul className="space-y-4">
        {data?.map((job) => (
          <li
            key={job.jobId}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <p className="font-semibold">{job.title}</p>
            <p className="text-sm text-slate-600">
              {job.company?.companyName} · {job.location} · {job.jobType}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={approve.isPending}
                onClick={() => approve.mutate(job.jobId)}
                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                Duyệt
              </button>
              <button
                type="button"
                onClick={() => setRejectId(job.jobId)}
                className="rounded-lg border border-red-300 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50"
              >
                Từ chối
              </button>
            </div>
            {rejectId === job.jobId && (
              <div className="mt-3 space-y-2">
                <textarea
                  rows={2}
                  placeholder="Lý do từ chối"
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
                <button
                  type="button"
                  disabled={reject.isPending || !reason.trim()}
                  onClick={() =>
                    reject.mutate({ jobId: job.jobId, reason: reason.trim() })
                  }
                  className="flex items-center gap-2 rounded-lg bg-red-600 px-3 py-1.5 text-sm text-white disabled:opacity-60"
                >
                  {reject.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
                  Xác nhận từ chối
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
