import { PlatformUsersManager } from "@/components/admin/platform-users-manager";
import { RequireAuth } from "@/components/require-auth";
import { SiteHeader } from "@/components/site-header";
import Link from "next/link";

export default function AdminPlatformUsersPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <RequireAuth roles={["STAFF", "SUPER_ADMIN"]}>
          <Link
            href="/staff/tong-quan"
            className="text-sm text-blue-700 hover:underline"
          >
            ← Staff
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">
            Tài khoản SV & NTD
          </h1>
          <p className="mb-6 text-sm text-slate-600">
            Xem tài khoản đang hoạt động, lần đăng nhập gần nhất. Super Admin có
            thể đặt lại mật khẩu hoặc khóa / kích hoạt.
          </p>
          <PlatformUsersManager />
        </RequireAuth>
      </main>
    </div>
  );
}
