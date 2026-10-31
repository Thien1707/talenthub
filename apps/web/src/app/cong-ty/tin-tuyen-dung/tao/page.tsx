import { AppShell } from "@/components/app-shell";
import { JobCreateForm } from "@/components/company/job-create-form";
import { RequireAuth } from "@/components/require-auth";
import { CompanySubnav } from "@/components/ui/company-subnav";

export default function JobCreatePage() {
  return (
    <AppShell
      title="Tạo tin tuyển dụng"
      description="Nhập thông tin tin — bước tiếp theo chọn quảng bá và thanh toán từ ví."
    >
      <RequireAuth roles={["COMPANY"]}>
        <CompanySubnav />
        <JobCreateForm />
      </RequireAuth>
    </AppShell>
  );
}
