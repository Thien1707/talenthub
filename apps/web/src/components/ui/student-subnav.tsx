"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/sinh-vien/ho-so", label: "Hồ sơ" },
  { href: "/sinh-vien/cv", label: "Quản lý CV" },
  { href: "/sinh-vien/ung-tuyen", label: "Ứng tuyển" },
  { href: "/sinh-vien/viec-da-luu", label: "Việc đã lưu" },
];

export function StudentSubnav() {
  const pathname = usePathname();
  return (
    <nav
      className="subnav-shell"
      aria-label="Sinh viên"
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
