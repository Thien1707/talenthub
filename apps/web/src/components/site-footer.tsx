"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { TalentHubLogo } from "@/components/ui/talenthub-logo";

export function SiteFooter() {
  const { user, loading } = useAuth();

  return (
    <footer className="th-footer">
      <svg
        className="th-footer-wave"
        viewBox="0 0 1440 40"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path d="M0,20 C360,40 720,0 1080,18 C1260,28 1380,32 1440,24 L1440,40 L0,40 Z" />
      </svg>
      <div className="mx-auto flex max-w-7xl flex-col gap-8 lg:flex-row lg:justify-between">
        <div className="max-w-sm">
          <TalentHubLogo compact />
          <p className="mt-3 text-sm leading-relaxed text-[var(--footer-muted)]">
            Kết nối sinh viên và doanh nghiệp — CV, ứng tuyển, chat và thanh toán
            tin tuyển dụng an toàn.
          </p>
        </div>
        <nav className="flex flex-wrap gap-10 text-sm" aria-label="Liên kết chân trang">
          <div>
            <p className="font-hand mb-2 text-2xl font-bold text-violet-300 dark:text-violet-400">
              Khám phá
            </p>
            <ul className="flex flex-col gap-2">
              <li>
                <Link href="/viec-lam">Việc làm</Link>
              </li>
              <li>
                <Link href="/sinh-vien/cv">Tạo CV</Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="font-hand mb-2 text-2xl font-bold text-violet-300 dark:text-violet-400">
              Tài khoản
            </p>
            <ul className="flex flex-col gap-2">
              {!loading && !user && (
                <>
                  <li>
                    <Link href="/dang-ky">Đăng ký</Link>
                  </li>
                  <li>
                    <Link href="/dang-nhap">Đăng nhập</Link>
                  </li>
                </>
              )}
              <li>
                <Link href="/dang-ky?role=company">Doanh nghiệp</Link>
              </li>
            </ul>
          </div>
        </nav>
      </div>
      <p className="mx-auto mt-10 max-w-7xl border-t border-dashed border-white/15 pt-6 text-sm text-[var(--footer-muted)]">
        © {new Date().getFullYear()} TalentHub
      </p>
    </footer>
  );
}
