import Link from "next/link";
import { RequireAuth } from "@/components/require-auth";
import { SiteHeader } from "@/components/site-header";
import { StaffDashboard } from "@/components/staff/staff-dashboard";

export default function StaffOverviewPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <RequireAuth roles={["STAFF", "SUPER_ADMIN"]}>
          <h1 className="mb-6 text-2xl font-bold text-slate-900">Staff — Tổng quan</h1>
          <nav className="mb-6 flex flex-wrap gap-3 text-sm">
            <Link href="/staff/tin-cho-duyet" className="text-blue-700 hover:underline">
              Duyệt tin
            </Link>
            <Link href="/staff/bao-cao" className="text-blue-700 hover:underline">
              Báo cáo
            </Link>
            <Link href="/staff/nhat-ky" className="text-blue-700 hover:underline">
              Nhật ký duyệt
            </Link>
            <Link href="/staff/cong-ty-xac-minh" className="text-blue-700 hover:underline">
              Xác minh công ty
            </Link>
            <Link href="/staff/danh-gia" className="text-blue-700 hover:underline">
              Đánh giá
            </Link>
            <Link href="/admin/tai-khoan" className="text-blue-700 hover:underline">
              Tài khoản SV / NTD
            </Link>
          </nav>
          <StaffDashboard />
        </RequireAuth>
      </main>
    </div>
  );
}
