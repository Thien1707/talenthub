"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Suspense } from "react";
import { toast } from "sonner";
import { JobApplicantsPanel } from "@/components/company/job-applicants-panel";
import { api } from "@/lib/api/client";
import { jobStatusBadgeClass, jobStatusLabel } from "@/lib/job-status";

type JobRow = {
  jobId: string;
  title: string;
  status: string;
  jobType: string;
  slug: string;
  isPaid: boolean;
};

export function CompanyJobsPanel() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["jobs", "company"],
    queryFn: async () => {
      const { data } = await api.get<{ items: JobRow[] }>("/jobs/company/mine");
      return data.items;
    },
  });

  const invalidateJobs = () => {
    void qc.invalidateQueries({ queryKey: ["jobs", "company"] });
    void qc.invalidateQueries({ queryKey: ["jobs", "public"] });
  };

  const apiMessage = (err: unknown) =>
    (err as { response?: { data?: { message?: string } } })?.response?.data
      ?.message;

  const pauseJob = useMutation({
    mutationFn: (jobId: string) => api.post(`/jobs/company/${jobId}/pause`),
    onSuccess: () => {
      toast.success("Tin đã chuyển sang Tạm dừng — ẩn khỏi tìm việc, có thể tiếp tục sau");
      invalidateJobs();
    },
    onError: (err) => toast.error(apiMessage(err) ?? "Tạm dừng thất bại"),
  });

  const resumeJob = useMutation({
    mutationFn: (jobId: string) => api.post(`/jobs/company/${jobId}/resume`),
    onSuccess: () => {
      toast.success("Tin đã hiển thị lại (Đang tuyển)");
      invalidateJobs();
    },
    onError: (err) => toast.error(apiMessage(err) ?? "Tiếp tục tin thất bại"),
  });

  const closeJob = useMutation({
    mutationFn: (jobId: string) => api.post(`/jobs/company/${jobId}/close`),
    onSuccess: () => {
      toast.success("Tin đã đóng — kết thúc tuyển dụng, không thể tiếp tục");
      invalidateJobs();
    },
    onError: (err) => toast.error(apiMessage(err) ?? "Đóng tin thất bại"),
  });

  return (
    <div className="space-y-8">
      <section className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-blue-100 bg-blue-50/60 p-5">
        <div>
          <h2 className="font-semibold text-slate-900">Đăng tin mới</h2>
          <p className="mt-1 text-sm text-slate-600">
            3 tin thường đầu miễn phí — từ tin thứ 4 tính phí theo bảng giá admin. Thanh toán qua ví.
          </p>
        </div>
        <Link
          href="/cong-ty/tin-tuyen-dung/tao"
          className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
        >
          + Tạo tin
        </Link>
      </section>

      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Tin của công ty</h2>
          <Link
            href="/cong-ty/vi-tien"
            className="text-sm font-medium text-blue-700 hover:underline"
          >
            Ví đăng tin →
          </Link>
        </div>
        {isLoading && <p className="text-slate-500">Đang tải...</p>}
        <ul className="space-y-3">
          {data?.map((job) => (
            <li
              key={job.jobId}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium">{job.title}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-2 text-sm">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${jobStatusBadgeClass(job.status)}`}
                    >
                      {jobStatusLabel(job.status)}
                    </span>
                    <span className="text-slate-500">{job.jobType}</span>
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {job.status === "APPROVED" && (
                    <Link
                      href={`/viec-lam/${job.slug}`}
                      className="text-sm text-blue-700 hover:underline"
                    >
                      Xem công khai
                    </Link>
                  )}
                  {(job.status === "DRAFT" || job.status === "REJECTED") && (
                    <Link
                      href={`/cong-ty/tin-tuyen-dung/${job.jobId}/dang-tin`}
                      className="rounded bg-emerald-600 px-3 py-1 text-sm text-white hover:bg-emerald-700"
                    >
                      Thanh toán &amp; gửi duyệt
                    </Link>
                  )}
                  {job.status === "APPROVED" && (
                    <>
                      <button
                        type="button"
                        className="rounded border border-amber-500 px-3 py-1 text-sm text-amber-800 hover:bg-amber-50 disabled:opacity-60"
                        disabled={pauseJob.isPending}
                        onClick={() => pauseJob.mutate(job.jobId)}
                      >
                        Tạm dừng
                      </button>
                      <button
                        type="button"
                        className="rounded border border-red-400 px-3 py-1 text-sm text-red-700 hover:bg-red-50 disabled:opacity-60"
                        disabled={closeJob.isPending}
                        onClick={() => closeJob.mutate(job.jobId)}
                      >
                        Đóng tin
                      </button>
                    </>
                  )}
                  {job.status === "PAUSED" && (
                    <>
                      <button
                        type="button"
                        className="rounded border border-emerald-600 px-3 py-1 text-sm text-emerald-800 hover:bg-emerald-50 disabled:opacity-60"
                        disabled={resumeJob.isPending}
                        onClick={() => resumeJob.mutate(job.jobId)}
                      >
                        Tiếp tục hiển thị
                      </button>
                      <button
                        type="button"
                        className="rounded border border-red-400 px-3 py-1 text-sm text-red-700 hover:bg-red-50 disabled:opacity-60"
                        disabled={closeJob.isPending}
                        onClick={() => closeJob.mutate(job.jobId)}
                      >
                        Đóng tin
                      </button>
                    </>
                  )}
                  {job.status === "CLOSED" && (
                    <span className="text-xs text-slate-500">
                      Tin đã đóng — chỉ xem ứng viên / lịch sử
                    </span>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>
      {data && (
        <Suspense fallback={<p className="mt-10 text-sm text-slate-600">Đang tải ứng viên…</p>}>
          <JobApplicantsPanel jobs={data} />
        </Suspense>
      )}
    </div>
  );
}
