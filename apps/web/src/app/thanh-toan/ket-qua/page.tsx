"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { AppShell } from "@/components/app-shell";

function PaymentResultInner() {
  const params = useSearchParams();
  const code = params.get("vnp_ResponseCode");
  const ok = code === "00";

  return (
    <div className="th-card">
      {ok ? (
        <>
          <h2 className="text-lg font-bold text-emerald-700">Thanh toán thành công</h2>
          <p className="mt-2 text-sm text-slate-600">
            Bạn có thể quay lại quản lý tin và bấm <strong>Gửi duyệt</strong>.
          </p>
        </>
      ) : (
        <>
          <h2 className="text-lg font-bold text-red-700">Thanh toán chưa thành công</h2>
          <p className="mt-2 text-sm text-slate-600">
            Mã phản hồi: {code ?? "—"}. Vui lòng thử lại hoặc liên hệ hỗ trợ.
          </p>
        </>
      )}
      <Link href="/cong-ty/tin-tuyen-dung" className="text-link mt-4">
        ← Quản lý tin tuyển dụng
      </Link>
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
