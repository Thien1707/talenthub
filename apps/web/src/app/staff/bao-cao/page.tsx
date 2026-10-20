import { AppShell } from "@/components/app-shell";
import { RequireAuth } from "@/components/require-auth";
import { ReportsQueue } from "@/components/staff/reports-queue";
import { StaffSubnav } from "@/components/ui/staff-subnav";

export default function StaffReportsPage() {
  return (
    <AppShell title="Báo cáo vi phạm" description="Xử lý báo cáo từ người dùng.">
      <RequireAuth roles={["STAFF", "SUPER_ADMIN"]}>
        <StaffSubnav />
        <ReportsQueue />
      </RequireAuth>
    </AppShell>
  );
}
