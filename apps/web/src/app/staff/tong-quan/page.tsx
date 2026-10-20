import { AppShell } from "@/components/app-shell";
import { RequireAuth } from "@/components/require-auth";
import { StaffDashboard } from "@/components/staff/staff-dashboard";
import { StaffSubnav } from "@/components/ui/staff-subnav";

export default function StaffOverviewPage() {
  return (
    <AppShell
      title="Staff — Tổng quan"
      description="Theo dõi hàng đợi duyệt tin, báo cáo và công việc vận hành."
    >
      <RequireAuth roles={["STAFF", "SUPER_ADMIN"]}>
        <StaffSubnav />
        <StaffDashboard />
      </RequireAuth>
    </AppShell>
  );
}
