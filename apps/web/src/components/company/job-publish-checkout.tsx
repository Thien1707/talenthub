"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
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
    return <p className="text-sm text-slate-500">Đang tải báo giá…</p>;
  }
  if (isError || !quote || !pricing) {
    return (
      <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        Không tải được thông tin thanh toán. Kiểm tra API hoặc quyền truy cập tin nháp.
      </p>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div className="space-y-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Tóm tắt tin tuyển dụng</h2>
          <p className="mt-2 font-medium text-slate-900">{quote.job.title}</p>
          <p className="text-sm text-slate-600">{quote.companyName}</p>
          <p className="mt-2 text-xs text-slate-500">
            Lượt miễn phí: {quote.freePostUsed}/{quote.freePostLimit}
            {quote.qualifiesForFreeBase ? " — tin này được miễn phí đăng (tin thường)" : ""}
          </p>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Gói quảng bá (tùy chọn)</h2>
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
                    className={`flex w-full cursor-pointer gap-3 rounded-xl border p-4 text-left transition-colors hover:border-blue-300 ${
                      isOn
                        ? "border-blue-500 bg-blue-50/50 ring-1 ring-blue-200"
                        : "border-slate-200"
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                        isOn
                          ? "border-blue-600 bg-blue-600 text-white"
                          : "border-slate-300 bg-white"
                      }`}
                      aria-hidden
                    >
                      {isOn ? "✓" : ""}
                    </span>
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">{p.displayName}</p>
                      {p.description ? (
                        <p className="mt-1 text-sm text-slate-600">{p.description}</p>
                      ) : null}
                      <p className="mt-1 text-xs text-slate-500">
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

      <aside className="h-fit space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:sticky lg:top-24">
        <h2 className="text-lg font-semibold">Thanh toán đăng tin</h2>
        <table className="mt-3 w-full text-sm">
          <tbody>
            <tr>
              <td className="py-1 text-slate-600">Phí đăng tin</td>
              <td className="py-1 text-right font-medium">
                {quote.baseFeeVnd === 0 ? "Miễn phí" : formatVND(quote.baseFeeVnd)}
              </td>
            </tr>
            {selected.map((code) => {
              const p = quote.availablePromotions.find((x) => x.code === code);
              if (!p) return null;
              return (
                <tr key={code}>
                  <td className="py-1 text-slate-600">{p.displayName}</td>
                  <td className="py-1 text-right">{formatVND(p.priceVnd)}</td>
                </tr>
              );
            })}
            <tr className="border-t">
              <td className="pt-3 font-semibold">Tổng</td>
              <td className="pt-3 text-right text-lg font-bold text-blue-700">
                {formatVND(pricing.totalVnd)}
              </td>
            </tr>
          </tbody>
        </table>
        <div className="rounded-xl bg-slate-50 px-3 py-2 text-sm">
          <p>
            Số dư ví: <strong>{formatVND(pricing.walletBalance)}</strong>
          </p>
          <p className="mt-1 text-slate-600">
            Còn lại sau thanh toán:{" "}
            <strong>{formatVND(Math.max(0, pricing.balanceAfter))}</strong>
          </p>
        </div>
        {insufficient ? (
          <p className="text-sm text-amber-800">
            Số dư không đủ.{" "}
            <Link href="/cong-ty/vi-tien" className="text-link font-medium">
              Nạp ví
            </Link>
          </p>
        ) : null}
        <div className="flex flex-col gap-2">
          <Link
            href="/cong-ty/tin-tuyen-dung/tao"
            className="rounded-lg border border-slate-300 px-4 py-2 text-center text-sm font-medium hover:bg-slate-50"
          >
            Quay lại chỉnh sửa
          </Link>
          <button
            type="button"
            disabled={insufficient || publish.isPending}
            onClick={() => setConfirmOpen(true)}
            className="rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            Đăng tin
          </button>
        </div>
      </aside>

      {confirmOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal
        >
          <div className="max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold">Xác nhận đăng tin</h3>
            <ul className="mt-3 space-y-1 text-sm text-slate-700">
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
                className="flex-1 rounded-lg border px-4 py-2 text-sm"
                disabled={publish.isPending}
                onClick={() => setConfirmOpen(false)}
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={publish.isPending}
                onClick={() => publish.mutate()}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
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
