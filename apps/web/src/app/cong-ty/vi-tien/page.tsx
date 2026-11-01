import { AppShell } from "@/components/app-shell";
import { WalletPanel } from "@/components/company/wallet-panel";
import { RequireAuth } from "@/components/require-auth";

export default function CompanyWalletPage() {
  return (
    <AppShell
      title="Ví đăng tin"
      description="Nạp tiền và xem lịch sử giao dịch phí đăng tin."
    >
      <RequireAuth roles={["COMPANY"]}>
        <WalletPanel />
      </RequireAuth>
    </AppShell>
  );
}
