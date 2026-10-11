"use client";

import Link from "next/link";
import { NotificationsBell } from "@/components/notifications/notifications-bell";
import { useAuth } from "./auth-provider";

export function SiteHeader() {
  const { user, loading, logout } = useAuth();

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-xl font-bold text-blue-700">
          TalentHub
        </Link>
        <nav className="flex items-center gap-4 text-sm font-medium text-slate-700">
          <Link href="/viec-lam" className="text-slate-800 hover:text-blue-700">
            Việc làm
          </Link>
          {!loading && user?.role === "STUDENT" && (
            <>
              <Link href="/sinh-vien/cv" className="hidden sm:inline text-slate-800 hover:text-blue-700">
                CV
              </Link>
              <Link href="/sinh-vien/ung-tuyen" className="hidden sm:inline text-slate-800 hover:text-blue-700">
                Ứng tuyển
              </Link>
              <Link href="/sinh-vien/viec-da-luu" className="hidden sm:inline text-slate-800 hover:text-blue-700">
                Đã lưu
              </Link>
            </>
          )}
          {!loading && user?.role === "COMPANY" && (
            <Link href="/cong-ty/ho-so" className="hidden sm:inline text-slate-800 hover:text-blue-700">
              Hồ sơ DN
            </Link>
          )}
          {!loading && user && (
            <Link href="/cai-dat/mat-khau" className="hidden md:inline text-slate-800 hover:text-blue-700">
              Mật khẩu
            </Link>
          )}
          {!loading && !user && (
            <>
              <Link href="/dang-nhap" className="text-slate-800 hover:text-blue-700">
                Đăng nhập
              </Link>
              <Link
                href="/dang-ky"
                className="rounded-md bg-blue-700 px-3 py-1.5 text-white hover:bg-blue-800"
              >
                Đăng ký
              </Link>
            </>
          )}
          {!loading && user && (
            <>
              <Link href="/tin-nhan" className="hidden sm:inline text-slate-800 hover:text-blue-700">
                Tin nhắn
              </Link>
              <NotificationsBell />
              <span className="hidden text-slate-600 sm:inline">
                {user.fullName}
              </span>
              <Link
                href={
                  user.role === "STUDENT"
                    ? "/sinh-vien/cv"
                    : user.role === "COMPANY"
                      ? "/cong-ty/tin-tuyen-dung"
                      : user.role === "SUPER_ADMIN"
                        ? "/admin/tong-quan"
                        : "/staff/tong-quan"
                }
                className="text-slate-800 hover:text-blue-700"
              >
                Bảng điều khiển
              </Link>
              {(user.role === "STAFF" || user.role === "SUPER_ADMIN") && (
                <Link href="/staff/tin-cho-duyet" className="hidden lg:inline text-slate-800 hover:text-blue-700">
                  Duyệt tin
                </Link>
              )}
              <button
                type="button"
                onClick={() => void logout()}
                className="text-slate-700 hover:text-red-600"
              >
                Đăng xuất
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
