import { AppShell } from "@/components/app-shell";
import { ExpenseWorkflow } from "@/components/admin/expense-workflow";
import { RequireAuth } from "@/components/require-auth";
import { AdminSubnav } from "@/components/ui/admin-subnav";

export default function AdminExpensesPage() {
  return (
    <AppShell title="Chi phí vận hành" description="Quy trình duyệt và thanh toán chi phí.">
      <RequireAuth roles={["SUPER_ADMIN"]}>
        <AdminSubnav />
        <ExpenseWorkflow />
      </RequireAuth>
    </AppShell>
  );
}
