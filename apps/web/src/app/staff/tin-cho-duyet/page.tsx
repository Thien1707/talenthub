import { AppShell } from "@/components/app-shell";
import { RequireAuth } from "@/components/require-auth";
import { ModerationPanel } from "@/components/staff/moderation-panel";
import { StaffSubnav } from "@/components/ui/staff-subnav";

export default function StaffModerationPage() {
  return (
    <AppShell title="Tin chờ duyệt" description="Kiểm duyệt tin tuyển dụng trước khi công khai.">
      <RequireAuth roles={["STAFF", "SUPER_ADMIN"]}>
        <StaffSubnav />
        <ModerationPanel />
      </RequireAuth>
    </AppShell>
  );
}
