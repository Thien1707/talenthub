"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo } from "react";
import { AppShell } from "@/components/app-shell";
import { api } from "@/lib/api/client";
import { formatVND } from "@/lib/format-money";

type CompleteReturnResponse = {
  success: boolean;
  message: string;
  walletCredited?: boolean;
  alreadyProcessed?: boolean;
  amountVnd?: number;
  vnpTxnRef?: string;
};

function PaymentResultInner() {
  const searchParams = useSearchParams();
  const qc = useQueryClient();

  const vnpQuery = useMemo(() => {
    const q: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      if (key.startsWith("vnp_")) q[key] = value;
    });
    return q;
  }, [searchParams]);

  const responseCode =
    searchParams.get("vnp_ResponseCode") ?? searchParams.get("code");
  const verifiedFlag = searchParams.get("verified");
  const creditedFlag = searchParams.get("walletCredited");
  const txnRef = searchParams.get("vnp_TxnRef") ?? vnpQuery.vnp_TxnRef;
  const hasVnpHash = Boolean(vnpQuery.vnp_SecureHash && vnpQuery.vnp_TxnRef);

  const needsServerConfirm =
    hasVnpHash && verifiedFlag === null && creditedFlag === null;

  const {
    data: confirm,
    isLoading: confirming,
    isError: confirmError,
    error: confirmErr,
    refetch: refetchConfirm,
  } = useQuery({
    queryKey: ["vnpay", "complete-return", vnpQuery],
    enabled: needsServerConfirm,
    retry: 1,
    queryFn: async () => {
      const { data } = await api.get<CompleteReturnResponse>(
        "/payments/vnpay/complete-return",
        { params: vnpQuery },
      );
      return data;
    },
  });

  const { data: status, isFetching: pollingStatus } = useQuery({
    queryKey: ["vnpay", "status", txnRef],
    enabled: Boolean(txnRef) && (confirm?.success || creditedFlag === "1"),
    queryFn: async () => {
      const { data } = await api.get<{
        walletBalanceVnd: string;
        walletCredited: boolean;
        amountVnd: number;
      }>("/payments/vnpay/status", { params: { vnp_TxnRef: txnRef } });
      return data;
    },
  });

  useEffect(() => {
    if (confirm?.success || creditedFlag === "1") {
      void qc.invalidateQueries({ queryKey: ["wallet"] });
    }
  }, [confirm?.success, creditedFlag, qc]);

  const serverOk =
    confirm?.success === true ||
    verifiedFlag === "1" ||
    creditedFlag === "1" ||
    status?.walletCredited;
  const displayOk = responseCode === "00" && serverOk;
  const signatureRejected = responseCode === "70";
  const processing =
    needsServerConfirm &&
    !confirmError &&
    (confirming || (responseCode === "00" && !serverOk));

  const confirmErrorMessage =
    confirmErr && typeof confirmErr === "object" && "response" in confirmErr
      ? String(
          (confirmErr as { response?: { status?: number } }).response?.status,
        ) === "404"
        ? "API chưa có endpoint xác nhận thanh toán — hãy restart server API (npm run build && npm run start trong apps/api)."
        : "Không xác nhận được giao dịch với server."
      : "Không xác nhận được giao dịch với server.";

  return (
    <div className="th-card space-y-3">
      {needsServerConfirm && confirmError ? (
        <>
          <h2 className="text-lg font-bold text-red-700">Chưa cập nhật được ví</h2>
          <p className="text-sm text-slate-600">{confirmErrorMessage}</p>
          <button
            type="button"
            className="mt-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white"
            onClick={() => void refetchConfirm()}
          >
            Thử xác nhận lại
          </button>
        </>
      ) : processing ? (
        <>
          <h2 className="text-lg font-bold text-slate-800">Đang xác nhận thanh toán…</h2>
          <p className="text-sm text-slate-600">
            Hệ thống đang kiểm tra giao dịch VNPAY và cập nhật số dư ví. Vui lòng đợi vài giây.
          </p>
        </>
      ) : displayOk ? (
        <>
          <h2 className="text-lg font-bold text-emerald-700">Thanh toán thành công</h2>
          <p className="text-sm text-slate-600">
            {confirm?.walletCredited || status?.walletCredited
              ? "Số dư ví đã được cập nhật trên hệ thống."
              : "Giao dịch đã được ghi nhận."}
            {status?.amountVnd
              ? ` Nạp ${formatVND(status.amountVnd)}.`
              : confirm?.amountVnd
                ? ` Nạp ${formatVND(confirm.amountVnd)}.`
                : null}
          </p>
          {status?.walletBalanceVnd ? (
            <p className="text-sm font-semibold text-blue-700">
              Số dư ví hiện tại: {formatVND(status.walletBalanceVnd)}
            </p>
          ) : null}
        </>
      ) : signatureRejected ? (
        <>
          <h2 className="text-lg font-bold text-red-700">VNPAY từ chối giao dịch (sai chữ ký)</h2>
          <p className="mt-2 text-sm text-slate-600">
            Mã 70 — kiểm tra cấu hình VNPAY trên API.
          </p>
        </>
      ) : (
        <>
          <h2 className="text-lg font-bold text-red-700">Thanh toán chưa hoàn tất</h2>
          <p className="text-sm text-slate-600">
            Mã phản hồi: {responseCode ?? "—"}.
            {confirm?.message ? ` ${confirm.message}` : ""}
          </p>
        </>
      )}
      {pollingStatus && !processing ? (
        <p className="text-xs text-slate-500">Đang tải số dư ví…</p>
      ) : null}
      <div className="flex flex-wrap gap-4 pt-2 text-sm">
        <Link href="/cong-ty/vi-tien" className="text-link">
          ← Ví đăng tin
        </Link>
        <Link href="/cong-ty/tin-tuyen-dung" className="text-link">
          Quản lý tin tuyển dụng
        </Link>
      </div>
    </div>
  );
}

export default function PaymentResultPage() {
  return (
    <AppShell title="Kết quả thanh toán" narrow>
      <Suspense fallback={<p className="text-sm text-slate-500">Đang xử lý…</p>}>
        <PaymentResultInner />
      </Suspense>
    </AppShell>
  );
}
