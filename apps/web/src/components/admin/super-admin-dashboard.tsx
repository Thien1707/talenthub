"use client";

import { useQuery } from "@tanstack/react-query";
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
