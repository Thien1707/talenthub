import { AppShell } from "@/components/app-shell";
import { PlatformUsersManager } from "@/components/admin/platform-users-manager";
import { RequireAuth } from "@/components/require-auth";
import { StaffSubnav } from "@/components/ui/staff-subnav";

export default function AdminPlatformUsersPage() {
  return (
    <AppShell
      title="Tài khoản SV & NTD"
      description="Xem tài khoản hoạt động; Super Admin có thể đặt lại mật khẩu hoặc khóa / kích hoạt."
    >
      <RequireAuth roles={["STAFF", "SUPER_ADMIN"]}>
        <StaffSubnav />
        <PlatformUsersManager />
      </RequireAuth>
    </AppShell>
  );
}
