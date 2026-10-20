"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, MessageSquare, X } from "lucide-react";
import { useState } from "react";
import { dashboardPath, useAuth } from "@/components/auth-provider";
import { NotificationsBell } from "@/components/notifications/notifications-bell";
import { TalentHubLogo } from "@/components/ui/talenthub-logo";

function navClass(active: boolean) {
  return active ? "nav-link nav-link-active" : "nav-link";
}

function mobileNavClass(active: boolean) {
  return active ? "mobile-nav-link bg-blue-50 text-blue-700" : "mobile-nav-link";
}

export function SiteHeader() {
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  const dashboardHref = user
    ? dashboardPath(user.role)
    : "/dang-nhap";

  const closeMobile = () => setMobileOpen(false);

  const studentDesktopLinks = (
    <>
      <Link href="/sinh-vien/cv" className={navClass(isActive("/sinh-vien/cv"))}>
        CV
      </Link>
      <Link href="/sinh-vien/ung-tuyen" className={navClass(isActive("/sinh-vien/ung-tuyen"))}>
        Ứng tuyển
      </Link>
      <Link href="/sinh-vien/viec-da-luu" className={navClass(isActive("/sinh-vien/viec-da-luu"))}>
        Đã lưu
      </Link>
    </>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl">
      <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between gap-4 px-5 lg:px-8">
        <TalentHubLogo />

        <nav
          className="hidden items-center gap-0.5 lg:flex"
          aria-label="Điều hướng chính"
        >
          <Link href="/viec-lam" className={navClass(isActive("/viec-lam"))}>
            Việc làm
          </Link>
          {!loading && user?.role === "STUDENT" && studentDesktopLinks}
          {!loading && user?.role === "COMPANY" && (
            <>
              <Link
                href="/cong-ty/tin-tuyen-dung"
                className={navClass(isActive("/cong-ty/tin-tuyen-dung"))}
              >
                Tin tuyển dụng
              </Link>
              <Link
                href="/cong-ty/ho-so"
                className={navClass(isActive("/cong-ty/ho-so"))}
              >
                Hồ sơ DN
              </Link>
            </>
          )}
          {!loading && (user?.role === "STAFF" || user?.role === "SUPER_ADMIN") && (
            <Link
              href="/staff/tin-cho-duyet"
              className={navClass(isActive("/staff/tin-cho-duyet"))}
            >
              Duyệt tin
            </Link>
          )}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {!loading && user && (
            <>
              <Link
                href="/tin-nhan"
                className="icon-button relative"
                aria-label="Tin nhắn"
              >
                <MessageSquare className="h-5 w-5" />
              </Link>
              <NotificationsBell />
              <span className="mx-1 hidden h-6 w-px bg-slate-200 xl:block" />
              <span className="hidden max-w-[10rem] truncate text-sm font-medium text-slate-600 xl:inline">
                {user.fullName}
              </span>
              <Link href={dashboardHref} className="button button-ghost hidden sm:inline-flex">
                Bảng điều khiển
              </Link>
              <Link
                href="/cai-dat/mat-khau"
                className="button button-ghost hidden lg:inline-flex"
              >
                Mật khẩu
              </Link>
              <button
                type="button"
                className="button button-danger-ghost"
                onClick={() => void logout()}
              >
                Đăng xuất
              </button>
            </>
          )}
          {!loading && !user && (
            <>
              <Link href="/dang-nhap" className="button button-ghost">
                Đăng nhập
              </Link>
              <Link href="/dang-ky?role=company" className="button button-primary">
                Đăng tin miễn phí
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="icon-button lg:hidden"
          onClick={() => setMobileOpen((o) => !o)}
          aria-label={mobileOpen ? "Đóng menu" : "Mở menu"}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-slate-100 bg-white px-5 py-4 lg:hidden">
          <nav className="grid gap-1" aria-label="Điều hướng di động">
            <Link
              href="/viec-lam"
              className={mobileNavClass(isActive("/viec-lam"))}
              onClick={closeMobile}
            >
              Việc làm
            </Link>
            {!loading && user?.role === "STUDENT" && (
              <>
                <Link
                  href="/sinh-vien/cv"
                  className={mobileNavClass(isActive("/sinh-vien/cv"))}
                  onClick={closeMobile}
                >
                  CV
                </Link>
                <Link
                  href="/sinh-vien/ung-tuyen"
                  className={mobileNavClass(isActive("/sinh-vien/ung-tuyen"))}
                  onClick={closeMobile}
                >
                  Ứng tuyển
                </Link>
                <Link
                  href="/sinh-vien/viec-da-luu"
                  className={mobileNavClass(isActive("/sinh-vien/viec-da-luu"))}
                  onClick={closeMobile}
                >
                  Việc đã lưu
                </Link>
              </>
            )}
            {!loading && user?.role === "COMPANY" && (
              <>
                <Link
                  href="/cong-ty/tin-tuyen-dung"
                  className={mobileNavClass(isActive("/cong-ty/tin-tuyen-dung"))}
                  onClick={closeMobile}
                >
                  Tin tuyển dụng
                </Link>
                <Link
                  href="/cong-ty/ho-so"
                  className={mobileNavClass(isActive("/cong-ty/ho-so"))}
                  onClick={closeMobile}
                >
                  Hồ sơ doanh nghiệp
                </Link>
              </>
            )}
            {!loading && user && (
              <>
                <Link
                  href="/tin-nhan"
                  className={mobileNavClass(isActive("/tin-nhan"))}
                  onClick={closeMobile}
                >
                  Tin nhắn
                </Link>
                <Link
                  href={dashboardHref}
                  className={mobileNavClass(false)}
                  onClick={closeMobile}
                >
                  Bảng điều khiển
                </Link>
                <Link
                  href="/cai-dat/mat-khau"
                  className={mobileNavClass(isActive("/cai-dat"))}
                  onClick={closeMobile}
                >
                  Đổi mật khẩu
                </Link>
                {(user.role === "STAFF" || user.role === "SUPER_ADMIN") && (
                  <Link
                    href="/staff/tin-cho-duyet"
                    className={mobileNavClass(isActive("/staff/tin-cho-duyet"))}
                    onClick={closeMobile}
                  >
                    Duyệt tin
                  </Link>
                )}
                <button
                  type="button"
                  className="mobile-nav-link text-left text-red-600"
                  onClick={() => {
                    closeMobile();
                    void logout();
                  }}
                >
                  Đăng xuất
                </button>
              </>
            )}
            {!loading && !user && (
              <div className="mt-3 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
                <Link href="/dang-nhap" className="button button-secondary" onClick={closeMobile}>
                  Đăng nhập
                </Link>
                <Link
                  href="/dang-ky"
                  className="button button-primary"
                  onClick={closeMobile}
                >
                  Đăng ký
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
