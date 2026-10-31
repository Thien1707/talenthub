"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { AppShell } from "@/components/app-shell";

function PaymentResultInner() {
  const params = useSearchParams();
  const code = params.get("vnp_ResponseCode");
  const ok = code === "00";
  const signatureRejected = code === "70" || params.get("code") === "70";

  return (
    <div className="th-card">
      {ok ? (
        <>
          <h2 className="text-lg font-bold text-emerald-700">Thanh toán thành công</h2>
          <p className="mt-2 text-sm text-slate-600">
            Bạn có thể quay lại quản lý tin và bấm <strong>Gửi duyệt</strong>.
          </p>
        </>
      ) : signatureRejected ? (
        <>
          <h2 className="text-lg font-bold text-red-700">VNPAY từ chối giao dịch (sai chữ ký)</h2>
          <p className="mt-2 text-sm text-slate-600">
            Mã 70 — cấu hình merchant hoặc tham số thanh toán không khớp sandbox. Thử nạp lại
            sau khi admin kiểm tra VNPAY_TMN_CODE và VNPAY_HASH_SECRET trên API.
          </p>
        </>
      ) : (
        <>
          <h2 className="text-lg font-bold text-red-700">Thanh toán chưa thành công</h2>
          <p className="mt-2 text-sm text-slate-600">
            Mã phản hồi: {code ?? params.get("code") ?? "—"}. Vui lòng thử lại hoặc liên hệ hỗ trợ.
          </p>
        </>
      )}
      <div className="mt-4 flex flex-wrap gap-4 text-sm">
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
