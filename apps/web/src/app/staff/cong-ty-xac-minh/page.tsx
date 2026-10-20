import { AppShell } from "@/components/app-shell";
import { RequireAuth } from "@/components/require-auth";
import { CompanyVerificationPanel } from "@/components/staff/company-verification-panel";
import { StaffSubnav } from "@/components/ui/staff-subnav";

export default function StaffCompanyVerifyPage() {
  return (
    <AppShell title="Xác minh doanh nghiệp" description="Duyệt hồ sơ công ty đăng ký trên nền tảng.">
      <RequireAuth roles={["STAFF", "SUPER_ADMIN"]}>
        <StaffSubnav />
        <CompanyVerificationPanel />
      </RequireAuth>
    </AppShell>
  );
}
