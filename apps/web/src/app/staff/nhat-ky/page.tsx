import { AppShell } from "@/components/app-shell";
import { RequireAuth } from "@/components/require-auth";
import { ModerationLogsPanel } from "@/components/staff/moderation-logs-panel";
import { StaffSubnav } from "@/components/ui/staff-subnav";

export default function StaffLogsPage() {
  return (
    <AppShell title="Nhật ký duyệt" description="Lịch sử thao tác kiểm duyệt trên hệ thống.">
      <RequireAuth roles={["STAFF", "SUPER_ADMIN"]}>
        <StaffSubnav />
        <ModerationLogsPanel />
      </RequireAuth>
    </AppShell>
  );
}
