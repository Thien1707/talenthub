import { AppShell } from "@/components/app-shell";
import { PostingPricingManager } from "@/components/admin/posting-pricing-manager";
import { RequireAuth } from "@/components/require-auth";
import { AdminSubnav } from "@/components/ui/admin-subnav";

export default function AdminPostingPricingPage() {
  return (
    <AppShell
      title="Bảng giá đăng tin"
      description="Cấu hình phí đăng tin cơ bản, lượt miễn phí và gói quảng bá cho nhà tuyển dụng."
    >
      <RequireAuth roles={["SUPER_ADMIN"]}>
        <AdminSubnav />
        <PostingPricingManager />
      </RequireAuth>
    </AppShell>
  );
}
