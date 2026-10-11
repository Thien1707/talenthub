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
      <p className="py-12 text-center text-slate-500">Đang tải phiên...</p>
    );
  }

  if (!user) {
    return (
      <p className="py-12 text-center">
        <Link href="/dang-nhap" className="text-blue-700 hover:underline">
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
