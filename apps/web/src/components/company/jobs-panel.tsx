"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { Suspense, useState } from "react";
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
};

type Category = { categoryId: string; categoryName: string };

export function CompanyJobsPanel() {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    title: "",
    categoryId: "",
    description: "",
    requirements: "",
    location: "",
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await api.get<Category[]>("/categories");
      return data;
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ["jobs", "company"],
    queryFn: async () => {
      const { data } = await api.get<{ items: JobRow[] }>("/jobs/company/mine");
      return data.items;
    },
  });

  const createJob = useMutation({
    mutationFn: () => api.post("/jobs/company", form),
    onSuccess: () => {
      toast.success("Đã tạo tin nháp");
      setForm({
        title: "",
        categoryId: "",
        description: "",
        requirements: "",
        location: "",
      });
      void qc.invalidateQueries({ queryKey: ["jobs", "company"] });
    },
    onError: () => toast.error("Tạo tin thất bại"),
  });

  const payForJob = async (jobId: string) => {
    const { data: order } = await api.post<{ orderId: string }>(
      "/orders/post-job",
      { jobId },
    );
    const { data: payment } = await api.post<{ paymentUrl: string }>(
      "/payments/vnpay/create",
      { orderId: order.orderId },
    );
    window.location.href = payment.paymentUrl;
  };

  const submitJob = useMutation({
    mutationFn: (jobId: string) => api.post(`/jobs/company/${jobId}/submit`),
    onSuccess: () => {
      toast.success("Đã gửi kiểm duyệt");
      void qc.invalidateQueries({ queryKey: ["jobs", "company"] });
    },
    onError: async (err: unknown, jobId: string) => {
      const res = (err as { response?: { status?: number; data?: { code?: string; message?: string } } })
        .response;
      if (res?.status === 402 || res?.data?.code === "PAYMENT_REQUIRED") {
        toast.message("Cần thanh toán để gửi tin");
        try {
          await payForJob(jobId);
        } catch {
          toast.error("Không tạo được thanh toán VNPAY. Kiểm tra cấu hình .env");
        }
        return;
      }
      const msg = res?.data?.message;
      toast.error(msg ?? "Gửi duyệt thất bại");
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
    <div className="grid gap-10 lg:grid-cols-2">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">Tạo tin nháp</h2>
        <div className="space-y-3">
          <input
            placeholder="Tiêu đề"
            className="w-full rounded-lg border px-3 py-2"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <select
            className="w-full rounded-lg border px-3 py-2"
            value={form.categoryId}
            onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
          >
            <option value="">Chọn danh mục</option>
            {categories?.map((c) => (
              <option key={c.categoryId} value={c.categoryId}>
                {c.categoryName}
              </option>
            ))}
          </select>
          <input
            placeholder="Địa điểm"
            className="w-full rounded-lg border px-3 py-2"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
          />
          <textarea
            placeholder="Mô tả"
            rows={3}
            className="w-full rounded-lg border px-3 py-2"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <textarea
            placeholder="Yêu cầu"
            rows={3}
            className="w-full rounded-lg border px-3 py-2"
            value={form.requirements}
            onChange={(e) => setForm({ ...form, requirements: e.target.value })}
          />
          <button
            type="button"
            disabled={createJob.isPending}
            onClick={() => createJob.mutate()}
            className="flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-white hover:bg-blue-800 disabled:opacity-60"
          >
            {createJob.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Lưu nháp
          </button>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold">Tin của công ty</h2>
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
                    <button
                      type="button"
                      className="rounded bg-emerald-600 px-3 py-1 text-sm text-white hover:bg-emerald-700 disabled:opacity-60"
                      disabled={submitJob.isPending}
                      onClick={() => submitJob.mutate(job.jobId)}
                    >
                      Gửi duyệt
                    </button>
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
