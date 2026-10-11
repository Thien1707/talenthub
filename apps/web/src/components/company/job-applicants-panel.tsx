"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ApplicantAiActions } from "@/components/company/applicant-ai-actions";
import { ApplicantCvViewer } from "@/components/company/applicant-cv-viewer";
import { api } from "@/lib/api/client";

const STATUSES = [
  "SUBMITTED",
  "REVIEWING",
  "SHORTLISTED",
  "INTERVIEW",
  "OFFERED",
  "HIRED",
  "REJECTED",
] as const;

export function JobApplicantsPanel({ jobs }: { jobs: Array<{ jobId: string; title: string; status: string }> }) {
  const approved = jobs.filter((j) => j.status === "APPROVED" || j.status === "PAUSED");
  const params = useSearchParams();
  const paramJobId = params.get("jobId") ?? "";
  const [jobId, setJobId] = useState(
    approved.some((j) => j.jobId === paramJobId)
      ? paramJobId
      : approved[0]?.jobId ?? "",
  );
  const qc = useQueryClient();

  useEffect(() => {
    if (paramJobId && approved.some((j) => j.jobId === paramJobId)) {
      setJobId(paramJobId);
    }
  }, [paramJobId, approved]);

  const { data, isLoading } = useQuery({
    queryKey: ["applications", "job", jobId],
    enabled: !!jobId,
    queryFn: async () => {
      const { data } = await api.get<
        Array<{
          applicationId: string;
          cvVersionId: string;
          status: string;
          student?: { fullName: string; email: string };
        }>
      >(`/applications/job/${jobId}`);
      return data;
    },
  });

  const openChat = useMutation({
    mutationFn: (applicationId: string) =>
      api.post<{ conversationId: string }>(
        `/conversations/application/${applicationId}`,
      ),
    onSuccess: (res) => {
      window.location.href = `/tin-nhan?c=${res.data.conversationId}`;
    },
    onError: () => toast.error("Không mở được hội thoại"),
  });

  const updateStatus = useMutation({
    mutationFn: ({
      applicationId,
      status,
    }: {
      applicationId: string;
      status: string;
    }) =>
      api.patch(`/applications/${applicationId}/status`, { status }),
    onSuccess: () => {
      toast.success("Đã cập nhật trạng thái");
      void qc.invalidateQueries({ queryKey: ["applications", "job", jobId] });
    },
  });

  if (approved.length === 0) {
    return (
      <p className="text-sm text-slate-600">
        Chưa có tin đã duyệt để xem ứng viên.
      </p>
    );
  }

  return (
    <div id="ung-vien" className="mt-10 scroll-mt-24 rounded-xl border bg-white p-4">
      <h2 className="text-lg font-semibold text-slate-900">Ứng viên</h2>
      <p className="mt-1 text-sm text-slate-600">
        Chọn tin đã duyệt, bấm <strong className="text-emerald-800">Xem CV</strong>{" "}
        để mở hồ sơ (PDF riêng tư hoặc builder).
      </p>
      <select
        className="mt-3 w-full rounded-lg border px-3 py-2 text-slate-900"
        value={jobId}
        onChange={(e) => setJobId(e.target.value)}
      >
        {approved.map((j) => (
          <option key={j.jobId} value={j.jobId}>
            {j.title}
          </option>
        ))}
      </select>
      {isLoading && <p className="mt-3 text-sm text-slate-600">Đang tải...</p>}
      <ul className="mt-4 space-y-3">
        {data?.map((app) => (
          <li
            key={app.applicationId}
            className="flex flex-wrap items-center justify-between gap-2 border-t pt-3 first:border-0 first:pt-0"
          >
            <div>
              <p className="font-medium text-slate-900">
                {app.student?.fullName ?? "Sinh viên"}
              </p>
              <p className="text-sm text-slate-600">{app.student?.email}</p>
            </div>
            <ApplicantCvViewer applicationId={app.applicationId} />
            <button
              type="button"
              className="text-sm text-blue-700 hover:underline"
              onClick={() => openChat.mutate(app.applicationId)}
            >
              Nhắn tin
            </button>
            <ApplicantAiActions
              applicationId={app.applicationId}
              cvVersionId={String(app.cvVersionId)}
              jobId={jobId}
            />
            <select
              className="rounded border px-2 py-1 text-sm"
              value={app.status}
              onChange={(e) =>
                updateStatus.mutate({
                  applicationId: app.applicationId,
                  status: e.target.value,
                })
              }
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </li>
        ))}
      </ul>
      {data?.length === 0 && !isLoading && (
        <p className="mt-3 text-sm text-slate-600">Chưa có ứng viên.</p>
      )}
    </div>
  );
}
