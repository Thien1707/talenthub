"use client";

import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { useAuth } from "@/components/auth-provider";
import { SiteHeader } from "@/components/site-header";
import { api } from "@/lib/api/client";

function VerifyInner() {
  const params = useSearchParams();
  const token = params.get("token");
  const { refreshMe } = useAuth();

  const verify = useMutation({
    mutationFn: (t: string) => api.post("/auth/verify-email", { token: t }),
    onSuccess: () => void refreshMe(),
  });

  useEffect(() => {
    if (token) verify.mutate(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chạy một lần theo token
  }, [token]);

  if (!token) {
    return (
      <p className="text-slate-700">
        Thiếu token. Hãy dùng liên kết trong email hoặc bấm gửi lại từ trang cài
        đặt.
      </p>
    );
  }

  if (verify.isPending) {
    return <p className="text-slate-700">Đang xác thực...</p>;
  }

  if (verify.isError) {
    return (
      <p className="text-red-700">
        Xác thực thất bại. Token có thể đã hết hạn — gửi lại liên kết mới.
      </p>
    );
  }

  return (
    <>
      <p className="text-emerald-700">Email đã được xác thực thành công.</p>
      <Link href="/" className="mt-4 inline-block text-blue-700 hover:underline">
        Về trang chủ
      </Link>
    </>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />
      <main className="mx-auto max-w-lg px-4 py-10">
        <h1 className="mb-4 text-2xl font-bold text-slate-900">Xác thực email</h1>
        <Suspense fallback={<p>Đang tải...</p>}>
          <VerifyInner />
        </Suspense>
      </main>
    </div>
  );
}
