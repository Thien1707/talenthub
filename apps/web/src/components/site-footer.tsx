"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth-provider";

export function SiteFooter() {
  const { user, loading } = useAuth();

  return (
    <footer className="mt-auto border-t border-slate-200 bg-slate-50">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between lg:px-8">
        <p>Kết nối sinh viên và doanh nghiệp trên TalentHub.</p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          {!loading && !user && (
            <>
              <Link href="/dang-ky" className="hover:text-blue-600">
                Đăng ký
              </Link>
              <Link href="/dang-nhap" className="hover:text-blue-600">
                Đăng nhập
              </Link>
            </>
          )}
          <span className="text-slate-400">
            © {new Date().getFullYear()} TalentHub
          </span>
        </div>
      </div>
    </footer>
  );
}
