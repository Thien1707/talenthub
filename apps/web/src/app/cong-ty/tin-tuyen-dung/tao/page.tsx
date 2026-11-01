import { AppShell } from "@/components/app-shell";
import { JobCreateForm } from "@/components/company/job-create-form";
import { RequireAuth } from "@/components/require-auth";

export default function JobCreatePage() {
  return (
    <AppShell>
      <RequireAuth roles={["COMPANY"]}>
        <JobCreateForm />
      </RequireAuth>
    </AppShell>
  );
}
