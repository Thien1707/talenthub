"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/staff/tong-quan", label: "Tổng quan" },
  { href: "/staff/tin-cho-duyet", label: "Duyệt tin" },
  { href: "/staff/bao-cao", label: "Báo cáo" },
  { href: "/staff/nhat-ky", label: "Nhật ký" },
  { href: "/staff/cong-ty-xac-minh", label: "Xác minh DN" },
  { href: "/staff/danh-gia", label: "Đánh giá" },
  { href: "/admin/tai-khoan", label: "Tài khoản SV/NTD" },
];

export function StaffSubnav() {
  const pathname = usePathname();
  return (
    <nav
      className="mb-8 flex flex-wrap gap-1 rounded-2xl border border-slate-200 bg-slate-100/80 p-1.5"
      aria-label="Staff"
    >
      {links.map(({ href, label }) => {
        const active =
          pathname === href || (href !== "/staff/tong-quan" && pathname.startsWith(href));
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
