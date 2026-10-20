"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/cong-ty/tin-tuyen-dung", label: "Tin tuyển dụng" },
  { href: "/cong-ty/ho-so", label: "Hồ sơ công ty" },
];

export function CompanySubnav() {
  const pathname = usePathname();
  return (
    <nav
      className="mb-8 flex flex-wrap gap-1 rounded-2xl border border-slate-200 bg-slate-100/80 p-1.5"
      aria-label="Nhà tuyển dụng"
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
