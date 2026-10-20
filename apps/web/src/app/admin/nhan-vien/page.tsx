import { AppShell } from "@/components/app-shell";
import { StaffManager } from "@/components/admin/staff-manager";
import { RequireAuth } from "@/components/require-auth";
import { AdminSubnav } from "@/components/ui/admin-subnav";

export default function AdminStaffPage() {
  return (
    <AppShell title="Quản lý nhân viên Staff" description="Tạo và quản lý tài khoản Staff.">
      <RequireAuth roles={["SUPER_ADMIN"]}>
        <AdminSubnav />
        <StaffManager />
      </RequireAuth>
    </AppShell>
  );
}
