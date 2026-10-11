import { StaffManager } from "@/components/admin/staff-manager";
import { RequireAuth } from "@/components/require-auth";
import { SiteHeader } from "@/components/site-header";

export default function AdminStaffPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <RequireAuth roles={["SUPER_ADMIN"]}>
          <h1 className="mb-6 text-2xl font-bold">Quản lý Staff</h1>
          <StaffManager />
        </RequireAuth>
      </main>
    </div>
  );
}
