"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { CreditCard, Loader2, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/components/auth-provider";
import { api } from "@/lib/api/client";
import { formatVND } from "@/lib/format-money";
import { jobStatusLabel } from "@/lib/job-status";
import { redirectToVnpayForJob } from "@/lib/post-job-payment";

type PricingPlan = {
  planId: string;
  planName: string;
  planType: "NORMAL_POST" | "VIP_POST" | "PACKAGE";
  price: number | string;
  durationDays: number;
  includedPosts?: number | null;
};

type PayableJob = {
  jobId: string;
  title: string;
  status: string;
  jobType: "NORMAL" | "VIP";
  isPaid: boolean;
};

function planForJobType(plans: PricingPlan[] | undefined, jobType: string) {
  const planType = jobType === "VIP" ? "VIP_POST" : "NORMAL_POST";
  return plans?.find((p) => p.planType === planType);
}

function PostPaymentPanelInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { user, refreshMe } = useAuth();
  const preselectJobId = params.get("jobId") ?? "";

  const quota = user?.companyProfile?.postingQuota as
    | {
        freePostUsed: number;
        freePostLimit: number;
        paidPostCount?: number;
      }
    | null
    | undefined;

  const freeRemaining = quota
    ? Math.max(0, quota.freePostLimit - quota.freePostUsed)
    : null;

  const { data: plans, isLoading: plansLoading } = useQuery({
    queryKey: ["pricing", "plans"],
    queryFn: async () => {
      const { data } = await api.get<PricingPlan[]>("/pricing/plans");
      return data;
    },
  });

  const { data: jobs, isLoading: jobsLoading } = useQuery({
    queryKey: ["jobs", "company", "payable"],
    queryFn: async () => {
      const { data } = await api.get<{ items: PayableJob[] }>("/jobs/company/mine");
      return data.items.filter(
        (j) =>
          (j.status === "DRAFT" || j.status === "REJECTED") && !j.isPaid,
      );
    },
  });

  const [selectedJobId, setSelectedJobId] = useState(preselectJobId);

  useEffect(() => {
    if (preselectJobId) setSelectedJobId(preselectJobId);
  }, [preselectJobId]);

  const selectedJob = useMemo(
    () => jobs?.find((j) => j.jobId === selectedJobId),
    [jobs, selectedJobId],
  );

  const selectedPlan = selectedJob
    ? planForJobType(plans, selectedJob.jobType)
    : undefined;

  const needsPayment = Boolean(
    selectedJob &&
      (selectedJob.jobType === "VIP" ||
        freeRemaining === null ||
        freeRemaining <= 0),
  );

  const canUseFreeQuota = Boolean(
    selectedJob &&
      selectedJob.jobType === "NORMAL" &&
      freeRemaining !== null &&
      freeRemaining > 0,
  );

  const pay = useMutation({
    mutationFn: () => redirectToVnpayForJob(selectedJobId),
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      toast.error(msg ?? "Không tạo được thanh toán. Kiểm tra cấu hình VNPAY.");
    },
  });

  const submitFree = useMutation({
    mutationFn: () => api.post(`/jobs/company/${selectedJobId}/submit`),
    onSuccess: async () => {
      toast.success("Đã gửi kiểm duyệt (dùng lượt miễn phí)");
      await refreshMe();
      router.push("/cong-ty/tin-tuyen-dung");
    },
    onError: (err: unknown) => {
      const res = (err as { response?: { status?: number; data?: { message?: string } } })
        .response;
      if (res?.status === 402) {
        toast.message("Hết lượt miễn phí — vui lòng thanh toán");
        return;
      }
      toast.error(res?.data?.message ?? "Gửi duyệt thất bại");
    },
  });

  const loading = plansLoading || jobsLoading;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
      <section className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Bảng giá đăng tin</h2>
          <p className="mt-1 text-sm text-slate-600">
            Mỗi công ty có {quota?.freePostLimit ?? 3} tin thường miễn phí. Hết
            lượt hoặc đăng tin VIP cần thanh toán qua VNPAY.
          </p>
          {loading ? (
            <p className="mt-4 text-sm text-slate-500">Đang tải bảng giá…</p>
          ) : (
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {plans
                ?.filter((p) => p.planType !== "PACKAGE")
                .map((plan) => (
                  <li
                    key={plan.planId}
                    className="rounded-xl border border-slate-100 bg-slate-50/80 p-4"
                  >
                    <p className="font-medium text-slate-900">{plan.planName}</p>
                    <p className="mt-1 text-2xl font-bold text-blue-700">
                      {formatVND(plan.price)}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Hiển thị {plan.durationDays} ngày sau khi duyệt
                    </p>
                  </li>
                ))}
            </ul>
          )}
          {plans?.some((p) => p.planType === "PACKAGE") ? (
            <p className="mt-3 text-xs text-slate-500">
              Gói nhiều tin: liên hệ quản trị — thanh toán trên web hiện áp dụng
              theo từng tin.
            </p>
          ) : null}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Chọn tin cần thanh toán</h2>
          {jobsLoading ? (
            <p className="mt-3 text-sm text-slate-500">Đang tải tin nháp…</p>
          ) : !jobs?.length ? (
            <p className="mt-3 text-sm text-slate-600">
              Chưa có tin nháp cần thanh toán.{" "}
              <Link href="/cong-ty/tin-tuyen-dung" className="text-link">
                Tạo tin mới
              </Link>
            </p>
          ) : (
            <ul className="mt-4 space-y-2">
              {jobs.map((job) => {
                const active = job.jobId === selectedJobId;
                const plan = planForJobType(plans, job.jobType);
                return (
                  <li key={job.jobId}>
                    <button
                      type="button"
                      onClick={() => setSelectedJobId(job.jobId)}
                      className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                        active
                          ? "border-blue-600 bg-blue-50/60 ring-1 ring-blue-600"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <p className="font-medium text-slate-900">{job.title}</p>
                      <p className="mt-1 flex flex-wrap gap-2 text-xs text-slate-600">
                        <span>{jobStatusLabel(job.status)}</span>
                        <span>·</span>
                        <span>{job.jobType === "VIP" ? "VIP" : "Thường"}</span>
                        {plan ? (
                          <>
                            <span>·</span>
                            <span>{formatVND(plan.price)}</span>
                          </>
                        ) : null}
                      </p>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:sticky lg:top-24">
        <h2 className="text-lg font-semibold text-slate-900">Tóm tắt</h2>

        {quota ? (
          <div className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            <p className="font-medium">Lượt miễn phí (tin thường)</p>
            <p className="mt-1">
              Đã dùng {quota.freePostUsed}/{quota.freePostLimit} — còn{" "}
              <strong>{freeRemaining ?? 0}</strong> lượt
            </p>
          </div>
        ) : null}

        {!selectedJob ? (
          <p className="mt-4 text-sm text-slate-500">Chọn một tin để xem phí.</p>
        ) : (
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-2 border-b border-slate-100 pb-3">
              <span className="text-slate-600">Tin</span>
              <span className="text-right font-medium text-slate-900">
                {selectedJob.title}
              </span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-slate-600">Loại</span>
              <span className="font-medium">
                {selectedJob.jobType === "VIP" ? "VIP" : "Thường"}
              </span>
            </div>
            <div className="flex justify-between gap-2 border-b border-slate-100 pb-3">
              <span className="text-slate-600">Phí dự kiến</span>
              <span className="text-lg font-bold text-blue-700">
                {needsPayment && selectedPlan
                  ? formatVND(selectedPlan.price)
                  : canUseFreeQuota
                    ? "Miễn phí (0 VND)"
                    : "—"}
              </span>
            </div>

            {canUseFreeQuota ? (
              <button
                type="button"
                disabled={submitFree.isPending}
                onClick={() => submitFree.mutate()}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {submitFree.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ShieldCheck className="h-4 w-4" />
                )}
                Gửi duyệt (dùng lượt miễn phí)
              </button>
            ) : null}

            {needsPayment ? (
              <button
                type="button"
                disabled={!selectedPlan || pay.isPending}
                onClick={() => pay.mutate()}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
              >
                {pay.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CreditCard className="h-4 w-4" />
                )}
                Thanh toán VNPAY
              </button>
            ) : null}

            <p className="text-xs leading-relaxed text-slate-500">
              Sau khi thanh toán thành công, quay lại{" "}
              <Link href="/cong-ty/tin-tuyen-dung" className="text-link">
                quản lý tin
              </Link>{" "}
              và bấm <strong>Gửi duyệt</strong>. Cổng sandbox VNPAY dùng thẻ test
              theo tài liệu VNPAY.
            </p>
          </div>
        )}
      </aside>
    </div>
  );
}

export function PostPaymentPanel() {
  return (
    <Suspense
      fallback={<p className="text-sm text-slate-500">Đang tải trang thanh toán…</p>}
    >
      <PostPaymentPanelInner />
    </Suspense>
  );
}
