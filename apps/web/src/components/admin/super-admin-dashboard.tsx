"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { api } from "@/lib/api/client";
import { formatVND } from "@/lib/format-money";

type SuperStats = {
  pendingJobs: number;
  pendingReports: number;
  paidOrders: number;
  revenueTotal: string;
  expensesTotal: string;
  expensesPending: number;
  totalUsers: number;
};

export function SuperAdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "super-dashboard"],
    queryFn: async () => {
      const { data } = await api.get<SuperStats>("/admin/dashboard/super");
      return data;
    },
  });

  if (isLoading) return <p className="text-slate-600">Đang tải...</p>;

  const fmt = (v?: string) => formatVND(v ?? 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Doanh thu (đơn PAID)" value={fmt(data?.revenueTotal)} />
        <StatCard label="Đơn đã thanh toán" value={String(data?.paidOrders ?? 0)} />
        <StatCard label="Chi phí đã duyệt" value={fmt(data?.expensesTotal)} />
        <StatCard label="Chi phí chờ duyệt" value={String(data?.expensesPending ?? 0)} />
      </div>
      <p className="text-sm text-slate-600">
        Người dùng: {data?.totalUsers} · Tin chờ duyệt: {data?.pendingJobs} · Báo
        cáo chờ: {data?.pendingReports}
      </p>
      <section className="space-y-3" aria-labelledby="access-management-title">
        <div>
          <h2 id="access-management-title" className="text-lg font-semibold text-slate-900">
            Quản lý quyền truy cập
          </h2>
          <p className="text-sm text-slate-600">
            Mở danh sách tài khoản theo nhóm quyền để quản lý trạng thái và nhân sự.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <AccessCard
            href="/admin/tai-khoan"
            title="Sinh viên & nhà tuyển dụng"
            description="Lọc tài khoản, đặt lại mật khẩu, khóa hoặc kích hoạt."
          />
          <AccessCard
            href="/admin/nhan-vien"
            title="Nhân viên Staff"
            description="Tạo, xem, khóa hoặc kích hoạt tài khoản Staff."
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <RoleSummary role="STUDENT" access="Hồ sơ, CV, tìm việc và ứng tuyển." />
          <RoleSummary role="COMPANY" access="Hồ sơ công ty, tin tuyển dụng, ứng viên và ví." />
          <RoleSummary role="STAFF" access="Duyệt tin, xác minh và xử lý nội dung." />
          <RoleSummary role="SUPER_ADMIN" access="Quản trị hệ thống, nhân sự và cấu hình." />
        </div>
        <p className="text-xs text-slate-500">
          Quyền hệ thống hiện được cố định theo vai trò; màn hình này tổng hợp quyền và mở các trang quản lý tài khoản.
        </p>
      </section>
    </div>
  );
}

function AccessCard({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link href={href} className="th-card block transition hover:-translate-y-0.5">
      <p className="font-semibold text-slate-900">{title}</p>
      <p className="mt-1 text-sm text-slate-600">{description}</p>
    </Link>
  );
}

function RoleSummary({ role, access }: { role: string; access: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-sm font-semibold text-slate-900">{role}</p>
      <p className="mt-1 text-sm text-slate-600">{access}</p>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="th-card">
      <p className="text-sm text-slate-600">{label}</p>
      <p className="mt-1 text-xl font-bold text-slate-900">{value}</p>
    </div>
  );
}
