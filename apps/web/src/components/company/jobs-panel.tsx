"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { Suspense, useState } from "react";
import { toast } from "sonner";
import { JobApplicantsPanel } from "@/components/company/job-applicants-panel";
import { api } from "@/lib/api/client";

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

  const pauseJob = useMutation({
    mutationFn: (jobId: string) => api.post(`/jobs/company/${jobId}/pause`),
    onSuccess: () => {
      toast.success("Đã tạm dừng tin");
      void qc.invalidateQueries({ queryKey: ["jobs", "company"] });
    },
  });

  const closeJob = useMutation({
    mutationFn: (jobId: string) => api.post(`/jobs/company/${jobId}/close`),
    onSuccess: () => {
      toast.success("Đã đóng tin");
      void qc.invalidateQueries({ queryKey: ["jobs", "company"] });
    },
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
                  <p className="text-sm text-slate-600">
                    {job.status} · {job.jobType}
                  </p>
                </div>
                <div className="flex gap-2">
                  {job.status === "APPROVED" && (
                    <Link
                      href={`/viec-lam/${job.slug}`}
                      className="text-sm text-blue-700 hover:underline"
                    >
                      Xem
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
                        className="rounded border border-amber-500 px-3 py-1 text-sm text-amber-800 hover:bg-amber-50"
                        onClick={() => pauseJob.mutate(job.jobId)}
                      >
                        Tạm dừng
                      </button>
                      <button
                        type="button"
                        className="rounded border border-red-400 px-3 py-1 text-sm text-red-700 hover:bg-red-50"
                        onClick={() => closeJob.mutate(job.jobId)}
                      >
                        Đóng tin
                      </button>
                    </>
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
