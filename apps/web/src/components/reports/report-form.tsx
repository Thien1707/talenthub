"use client";

import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api/client";

export function ReportForm({
  jobId,
  reportedUserId,
  messageId,
}: {
  jobId?: string;
  reportedUserId?: string;
  messageId?: string;
}) {
  const [reportType, setReportType] = useState("SPAM_OR_FAKE");
  const [reason, setReason] = useState("");

  const submit = useMutation({
    mutationFn: () =>
      api.post("/reports", {
        reportType,
        reason,
        jobId,
        reportedUserId,
        messageId,
      }),
    onSuccess: () => {
      toast.success("Đã gửi báo cáo. Staff sẽ xử lý.");
      setReason("");
    },
    onError: () => toast.error("Gửi báo cáo thất bại"),
  });

  return (
    <div className="max-w-lg space-y-3 rounded-xl border bg-white p-4">
      <label className="block text-sm font-medium text-slate-800">
        Loại vi phạm
      </label>
      <select
        className="w-full rounded-lg border px-3 py-2 text-slate-900"
        value={reportType}
        onChange={(e) => setReportType(e.target.value)}
      >
        <option value="SPAM_OR_FAKE">Tin giả / spam</option>
        <option value="HARASSMENT">Quấy rối</option>
        <option value="FRAUD">Lừa đảo</option>
        <option value="OTHER">Khác</option>
      </select>
      <label className="block text-sm font-medium text-slate-800">
        Mô tả chi tiết
      </label>
      <textarea
        rows={4}
        className="w-full rounded-lg border px-3 py-2 text-slate-900"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        minLength={10}
      />
      <button
        type="button"
        disabled={reason.length < 10 || submit.isPending}
        onClick={() => submit.mutate()}
        className="flex items-center gap-2 rounded-lg bg-red-700 px-4 py-2 text-white disabled:opacity-60"
      >
        {submit.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        Gửi báo cáo
      </button>
    </div>
  );
}
