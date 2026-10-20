"use client";

import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/components/auth-provider";
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
      <p className="text-sm text-slate-700">
        Thiếu token. Hãy dùng liên kết trong email hoặc bấm gửi lại từ trang cài
        đặt.
      </p>
    );
  }

  if (verify.isPending) {
    return <p className="text-sm text-slate-700">Đang xác thực…</p>;
  }

  if (verify.isError) {
    return (
      <p className="text-sm font-medium text-red-700">
        Xác thực thất bại. Token có thể đã hết hạn — gửi lại liên kết mới.
      </p>
    );
  }

  return (
    <>
      <p className="font-medium text-emerald-700">Email đã được xác thực thành công.</p>
      <Link href="/" className="text-link mt-4">
        Về trang chủ
      </Link>
    </>
  );
}

export default function VerifyEmailPage() {
  return (
    <AppShell title="Xác thực email" narrow>
      <div className="th-card">
        <Suspense fallback={<p className="text-sm text-slate-500">Đang tải…</p>}>
          <VerifyInner />
        </Suspense>
      </div>
    </AppShell>
  );
}
