"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth, type AuthUser } from "./auth-provider";

export function RequireAuth({
  roles,
  children,
}: {
  roles?: AuthUser["role"][];
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/dang-nhap");
  }, [loading, user, router]);

  if (loading) {
    return (
      <p className="py-12 text-center text-slate-500">
        <span className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-violet-200 border-t-violet-600" aria-hidden />
        <span className="mt-3 block font-medium">Đang tải phiên...</span>
      </p>
    );
  }

  if (!user) {
    return (
      <p className="py-12 text-center">
        <Link href="/dang-nhap" className="text-link">
          Vui lòng đăng nhập
        </Link>
      </p>
    );
  }

  if (roles && !roles.includes(user.role)) {
    return (
      <p className="py-12 text-center text-red-600">
        Bạn không có quyền truy cập trang này.
      </p>
    );
  }

  return <>{children}</>;
}
