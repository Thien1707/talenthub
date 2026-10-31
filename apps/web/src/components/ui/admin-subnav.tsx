"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin/tong-quan", label: "Tổng quan" },
  { href: "/admin/nhan-vien", label: "Nhân viên" },
  { href: "/admin/chi-phi", label: "Chi phí" },
  { href: "/admin/bang-gia", label: "Giá đăng tin" },
  { href: "/admin/tai-khoan", label: "Tài khoản SV/NTD" },
  { href: "/staff/tong-quan", label: "Staff" },
];

export function AdminSubnav() {
  const pathname = usePathname();
  return (
    <nav
      className="mb-8 flex flex-wrap gap-1 rounded-2xl border border-slate-200 bg-slate-100/80 p-1.5"
      aria-label="Super Admin"
    >
      {links.map(({ href, label }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            className={active ? "subnav-link subnav-link-active" : "subnav-link"}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
