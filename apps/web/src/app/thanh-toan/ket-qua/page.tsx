"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { SiteHeader } from "@/components/site-header";

function PaymentResultInner() {
  const params = useSearchParams();
  const code = params.get("vnp_ResponseCode");
  const ok = code === "00";

  return (
    <div className="rounded-xl border bg-white p-6 text-slate-800">
      {ok ? (
        <>
          <h2 className="text-lg font-semibold text-emerald-700">
            Thanh toán thành công
          </h2>
          <p className="mt-2 text-sm">
            Bạn có thể quay lại quản lý tin và bấm <strong>Gửi duyệt</strong>.
          </p>
        </>
      ) : (
        <>
          <h2 className="text-lg font-semibold text-red-700">
            Thanh toán chưa thành công
          </h2>
          <p className="mt-2 text-sm">
            Mã phản hồi: {code ?? "—"}. Vui lòng thử lại hoặc liên hệ hỗ trợ.
          </p>
        </>
      )}
      <Link
        href="/cong-ty/tin-tuyen-dung"
        className="mt-4 inline-block text-blue-700 hover:underline"
      >
        ← Quản lý tin tuyển dụng
      </Link>
    </div>
  );
}

export default function PaymentResultPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />
      <main className="mx-auto max-w-lg px-4 py-10">
        <h1 className="mb-6 text-2xl font-bold text-slate-900">Kết quả thanh toán</h1>
        <Suspense fallback={<p>Đang xử lý...</p>}>
          <PaymentResultInner />
        </Suspense>
      </main>
    </div>
  );
}
