import Link from "next/link";
import { SuperAdminDashboard } from "@/components/admin/super-admin-dashboard";
import { RequireAuth } from "@/components/require-auth";
import { SiteHeader } from "@/components/site-header";

export default function AdminOverviewPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <RequireAuth roles={["SUPER_ADMIN"]}>
          <h1 className="mb-2 text-2xl font-bold text-slate-900">Super Admin</h1>
          <p className="mb-6 text-sm text-slate-600">
            Doanh thu, chi phí và điều hành hệ thống.
          </p>
          <nav className="mb-6 flex flex-wrap gap-3 text-sm">
            <Link href="/staff/tong-quan" className="text-blue-700 hover:underline">
              Staff
            </Link>
            <Link href="/admin/nhan-vien" className="text-blue-700 hover:underline">
              Nhân viên
            </Link>
            <Link href="/admin/chi-phi" className="text-blue-700 hover:underline">
              Chi phí
            </Link>
          </nav>
          <SuperAdminDashboard />
        </RequireAuth>
      </main>
    </div>
  );
}
