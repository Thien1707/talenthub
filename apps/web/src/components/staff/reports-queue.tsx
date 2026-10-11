"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api/client";

type ReportRow = {
  reportId: string;
  reportType: string;
  reason: string;
  status: string;
  reporter?: { fullName: string };
  reportedUser?: { fullName: string } | null;
  job?: { title: string } | null;
};

export function ReportsQueue() {
  const qc = useQueryClient();
  const [note, setNote] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["reports", "staff"],
    queryFn: async () => {
      const { data } = await api.get<ReportRow[]>("/reports/staff/queue");
      return data;
    },
  });

  const assign = useMutation({
    mutationFn: (id: string) => api.patch(`/reports/staff/${id}/assign`),
    onSuccess: () => {
      toast.success("Đã nhận xử lý");
      void qc.invalidateQueries({ queryKey: ["reports", "staff"] });
    },
  });

  const resolve = useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: "RESOLVED" | "REJECTED";
    }) =>
      api.patch(`/reports/staff/${id}/resolve`, {
        status,
        resolutionNote: note || undefined,
      }),
    onSuccess: () => {
      toast.success("Đã cập nhật báo cáo");
      setActiveId(null);
      setNote("");
      void qc.invalidateQueries({ queryKey: ["reports", "staff"] });
    },
  });

  return (
    <div>
      {isLoading && <p className="text-slate-600">Đang tải...</p>}
      <ul className="space-y-4">
        {data?.map((r) => (
          <li key={r.reportId} className="rounded-xl border bg-white p-4">
            <p className="font-semibold text-slate-900">
              {r.reportType} · {r.status}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Người gửi: {r.reporter?.fullName} · Đối tượng:{" "}
              {r.reportedUser?.fullName ?? r.job?.title ?? "—"}
            </p>
            <p className="mt-2 text-sm text-slate-800 whitespace-pre-wrap">{r.reason}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded border px-3 py-1 text-sm"
                onClick={() => assign.mutate(r.reportId)}
              >
                Nhận xử lý
              </button>
              <button
                type="button"
                className="rounded bg-emerald-600 px-3 py-1 text-sm text-white"
                onClick={() => setActiveId(r.reportId)}
              >
                Kết luận
              </button>
            </div>
            {activeId === r.reportId && (
              <div className="mt-3 border-t pt-3">
                <textarea
                  className="w-full rounded border px-2 py-1 text-sm"
                  rows={2}
                  placeholder="Ghi chú xử lý"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    disabled={resolve.isPending}
                    onClick={() =>
                      resolve.mutate({ id: r.reportId, status: "RESOLVED" })
                    }
                    className="rounded bg-emerald-700 px-3 py-1 text-sm text-white"
                  >
                    Chấp nhận báo cáo
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      resolve.mutate({ id: r.reportId, status: "REJECTED" })
                    }
                    className="rounded border px-3 py-1 text-sm"
                  >
                    Từ chối báo cáo
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
      {assign.isPending && (
        <p className="mt-2 flex items-center gap-1 text-sm text-slate-600">
          <Loader2 className="h-4 w-4 animate-spin" /> Đang xử lý...
        </p>
      )}
    </div>
  );
}
