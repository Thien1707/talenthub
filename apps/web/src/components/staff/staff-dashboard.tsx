"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { api } from "@/lib/api/client";

type StaffStats = {
  pendingJobs: number;
  pendingReports: number;
  inReviewReports: number;
  pendingCompanies: number;
  totalUsers: number;
  totalApplications: number;
};

export function StaffDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "staff-dashboard"],
    queryFn: async () => {
      const { data } = await api.get<StaffStats>("/admin/dashboard/staff");
      return data;
    },
  });

  if (isLoading) return <p className="text-slate-600">Đang tải...</p>;

  const cards = [
    { label: "Tin chờ duyệt", value: data?.pendingJobs, href: "/staff/tin-cho-duyet" },
    { label: "Báo cáo chờ xử lý", value: data?.pendingReports, href: "/staff/bao-cao" },
    { label: "Báo cáo đang xử lý", value: data?.inReviewReports, href: "/staff/bao-cao" },
    { label: "Công ty chờ xác minh", value: data?.pendingCompanies, href: "/staff/cong-ty-xac-minh" },
    { label: "Người dùng", value: data?.totalUsers },
    { label: "Hồ sơ ứng tuyển", value: data?.totalApplications },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((c) => (
        <div
          key={c.label}
          className="th-card-hover"
        >
          <p className="text-sm text-slate-600">{c.label}</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{c.value ?? 0}</p>
          {c.href && (
            <Link href={c.href} className="mt-2 inline-block text-sm text-blue-700 hover:underline">
              Xem →
            </Link>
          )}
        </div>
      ))}
    </div>
  );
}
