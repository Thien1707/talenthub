import { AppShell } from "@/components/app-shell";
import { CompanyJobsPanel } from "@/components/company/jobs-panel";
import { RequireAuth } from "@/components/require-auth";

export default function CompanyJobsPage() {
  return (
    <AppShell>
      <RequireAuth roles={["COMPANY"]}>
        <CompanyJobsPanel />
      </RequireAuth>
    </AppShell>
  );
}
