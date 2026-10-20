import { AppShell } from "@/components/app-shell";
import { CompanyProfileForm } from "@/components/company/profile-form";
import { RequireAuth } from "@/components/require-auth";
import { CompanySubnav } from "@/components/ui/company-subnav";

export default function CompanyProfilePage() {
  return (
    <AppShell title="Hồ sơ doanh nghiệp" description="Thông tin công ty hiển thị trên tin tuyển dụng.">
      <RequireAuth roles={["COMPANY"]}>
        <CompanySubnav />
        <CompanyProfileForm />
      </RequireAuth>
    </AppShell>
  );
}
