import { AppShell } from "@/components/app-shell";
import { CompanyJobsPanel } from "@/components/company/jobs-panel";
import { RequireAuth } from "@/components/require-auth";
import { CompanySubnav } from "@/components/ui/company-subnav";

export default function CompanyJobsPage() {
  return (
    <AppShell
      title="Quản lý tin tuyển dụng"
      description="Tạo tin nháp, gửi duyệt, thanh toán và quản lý ứng viên."
    >
      <RequireAuth roles={["COMPANY"]}>
        <CompanySubnav />
        <CompanyJobsPanel />
      </RequireAuth>
    </AppShell>
  );
}
