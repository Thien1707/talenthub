"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowUpRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api/client";
import { extractApiErrorMessage } from "@/lib/extract-api-error";
import { formatVND, parseVndAmount } from "@/lib/format-money";
import {
  computePromotionTotals,
  type PromoCode,
} from "@/lib/posting-quote";
import { JobPublishReceipt } from "@/components/company/job-publish-receipt";
import receiptStyles from "@/components/company/job-publish-receipt.module.css";

type Quote = {
  job: { jobId: string; title: string; jobType: string };
  companyName: string;
  walletBalanceVnd: number | string;
  balanceAfterVnd: number | string;
  qualifiesForFreeBase: boolean;
  baseFeeVnd: number;
  promotionTotalVnd: number;
  totalVnd: number;
  freePostUsed: number;
  freePostLimit: number;
  availablePromotions: {
    code: PromoCode;
    displayName: string;
    description?: string | null;
    priceVnd: number;
    durationDays: number;
  }[];
};

function newIdempotencyKey() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `pub-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function JobPublishCheckout({ jobId }: { jobId: string }) {
  const router = useRouter();
  const qc = useQueryClient();
  const [selected, setSelected] = useState<PromoCode[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { data: quote, isLoading, isError } = useQuery({
    queryKey: ["publish-quote", jobId],
    queryFn: async () => {
      const { data } = await api.get<Quote>(
        `/jobs/company/${jobId}/publish-quote`,
      );
      return data;
    },
    staleTime: 60_000,
  });

  const pricing = useMemo(() => {
    if (!quote) return null;
    const { promotionTotalVnd, totalVnd } = computePromotionTotals(
      quote.baseFeeVnd,
      quote.availablePromotions,
      selected,
    );
    const walletBalance = parseVndAmount(quote.walletBalanceVnd) ?? 0;
    return {
      promotionTotalVnd,
      totalVnd,
      walletBalance,
      balanceAfter: walletBalance - totalVnd,
    };
  }, [quote, selected]);

  const insufficient = useMemo(() => {
    if (!pricing) return false;
    return pricing.totalVnd > pricing.walletBalance;
  }, [pricing]);

  const toggle = (code: PromoCode) => {
    setSelected((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code],
    );
  };

  const publish = useMutation({
    mutationFn: async () => {
      const { data } = await api.post<{
        jobId: string;
        status: string;
        totalVnd: number;
        walletBalanceVnd: string;
      }>(`/jobs/company/${jobId}/publish`, {
        idempotencyKey: newIdempotencyKey(),
        promotionCodes: selected,
      });
      return data;
    },
    onSuccess: (data) => {
      toast.success("Đã gửi tin kiểm duyệt thành công");
      void qc.invalidateQueries({ queryKey: ["jobs", "company"] });
      void qc.invalidateQueries({ queryKey: ["wallet"] });
      router.push("/cong-ty/tin-tuyen-dung");
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response
        ?.data?.message;
      toast.error(
        extractApiErrorMessage(err, msg ?? "Thanh toán / gửi duyệt thất bại"),
      );
      setConfirmOpen(false);
    },
  });

  if (isLoading && !quote) {
    return <p className="text-sm text-[var(--color-text-muted)]">Đang tải báo giá…</p>;
  }
  if (isError || !quote || !pricing) {
    return (
      <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        Không tải được thông tin thanh toán. Kiểm tra API hoặc quyền truy cập tin nháp.
      </p>
    );
  }

  const receiptDate = new Date().toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const receiptLines = [
    {
      label: "Phí đăng tin",
      value:
        quote.baseFeeVnd === 0 ? "Miễn phí" : formatVND(quote.baseFeeVnd),
    },
    ...selected.flatMap((code) => {
      const p = quote.availablePromotions.find((x) => x.code === code);
      if (!p) return [];
      return [{ label: p.displayName, value: formatVND(p.priceVnd) }];
    }),
  ];

  const receiptBalanceLines = [
    {
      label: "Số dư ví",
      value: formatVND(pricing.walletBalance),
      muted: true,
    },
    {
      label: "Còn lại sau thanh toán",
      value: formatVND(Math.max(0, pricing.balanceAfter)),
      muted: true,
    },
  ];

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div className="space-y-6">
        <section className="th-card">
          <h2 className="text-lg font-semibold text-[var(--ink)]">Tóm tắt tin tuyển dụng</h2>
          <p className="mt-2 font-medium text-[var(--ink)]">{quote.job.title}</p>
          <p className="text-sm text-[var(--color-text-muted)]">{quote.companyName}</p>
          <p className="mt-2 text-xs text-[var(--color-text-muted)]">
            Lượt miễn phí: {quote.freePostUsed}/{quote.freePostLimit}
            {quote.qualifiesForFreeBase ? " — tin này được miễn phí đăng (tin thường)" : ""}
          </p>
        </section>

        <section className="th-card">
          <h2 className="text-lg font-semibold text-[var(--ink)]">Gói quảng bá (tùy chọn)</h2>
          <ul className="mt-4 space-y-3">
            {quote.availablePromotions.map((p) => {
              const isOn = selected.includes(p.code);
              return (
                <li key={p.code}>
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={isOn}
                    onClick={() => toggle(p.code)}
                    className={`flex w-full cursor-pointer gap-3 rounded-xl border p-4 text-left transition-colors hover:border-violet-400 ${
                      isOn
                        ? "border-violet-500 bg-violet-50/80 ring-1 ring-violet-200 dark:border-violet-400 dark:bg-violet-100/40 dark:ring-violet-500/40"
                        : "border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-surface)_60%,transparent)]"
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                        isOn
                          ? "border-violet-600 bg-violet-600 text-white"
                          : "border-[var(--color-border-strong)] bg-[var(--color-surface)]"
                      }`}
                      aria-hidden
                    >
                      {isOn ? "✓" : ""}
                    </span>
                    <div className="flex-1">
                      <p className="font-medium text-[var(--ink)]">{p.displayName}</p>
                      {p.description ? (
                        <p className="mt-1 text-sm text-[var(--color-text-muted)]">{p.description}</p>
                      ) : null}
                      <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                        {p.durationDays} ngày · {formatVND(p.priceVnd)}
                      </p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <aside className="h-fit rounded-2xl bg-[color-mix(in_srgb,var(--color-border)_55%,var(--color-surface))] p-4 shadow-sm lg:sticky lg:top-24">
        <JobPublishReceipt
          printSignature={`${pricing.totalVnd}|${selected.join(",")}|${pricing.walletBalance}`}
          dateLabel={receiptDate}
          lines={receiptLines}
          afterTotalLines={receiptBalanceLines}
          totalValue={formatVND(pricing.totalVnd)}
          note={
            insufficient ? (
              <>
                Số dư ví không đủ cho tổng thanh toán. Nạp thêm trước khi đăng tin.
              </>
            ) : (
              <>Thanh toán trừ trực tiếp từ ví công ty sau khi xác nhận.</>
            )
          }
          showTopUp={insufficient}
          backHref="/cong-ty/tin-tuyen-dung/tao"
          footer={
            <>
              {!insufficient ? (
                <Link
                  href="/cong-ty/tin-tuyen-dung/tao"
                  className={receiptStyles.btnSecondary}
                >
                  Quay lại chỉnh sửa
                  <ArrowUpRight className="h-3 w-3" aria-hidden />
                </Link>
              ) : null}
              <button
                type="button"
                disabled={insufficient || publish.isPending}
                onClick={() => setConfirmOpen(true)}
                className={receiptStyles.publishBtn}
              >
                {publish.isPending ? (
                  <>
                    <Loader2 className="mr-1 inline h-4 w-4 animate-spin" />
                    Đang xử lý…
                  </>
                ) : (
                  "Đăng tin"
                )}
              </button>
            </>
          }
        />
      </aside>

      {confirmOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal
        >
          <div className="th-card max-w-md shadow-xl">
            <h3 className="text-lg font-bold text-[var(--ink)]">Xác nhận đăng tin</h3>
            <ul className="mt-3 space-y-1 text-sm text-[var(--color-text-muted)]">
              <li>
                <strong>Tin:</strong> {quote.job.title}
              </li>
              <li>
                <strong>Tổng thanh toán:</strong> {formatVND(pricing.totalVnd)}
              </li>
              <li>
                <strong>Số dư hiện tại:</strong>{" "}
                {formatVND(pricing.walletBalance)}
              </li>
              <li>
                <strong>Số dư sau:</strong>{" "}
                {formatVND(Math.max(0, pricing.balanceAfter))}
              </li>
            </ul>
            <div className="mt-6 flex gap-2">
              <button
                type="button"
                className="button button-secondary flex-1"
                disabled={publish.isPending}
                onClick={() => setConfirmOpen(false)}
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={publish.isPending}
                onClick={() => publish.mutate()}
                className="button button-primary flex flex-1 items-center justify-center gap-2"
              >
                {publish.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Xác nhận &amp; thanh toán
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
