import { AppShell } from "@/components/app-shell";
import { SuperAdminDashboard } from "@/components/admin/super-admin-dashboard";
import { RequireAuth } from "@/components/require-auth";
import { AdminSubnav } from "@/components/ui/admin-subnav";

export default function AdminOverviewPage() {
  return (
    <AppShell
      title="Super Admin"
      description="Doanh thu, chi phí và điều hành hệ thống TalentHub."
    >
      <RequireAuth roles={["SUPER_ADMIN"]}>
        <AdminSubnav />
        <SuperAdminDashboard />
      </RequireAuth>
    </AppShell>
  );
}
