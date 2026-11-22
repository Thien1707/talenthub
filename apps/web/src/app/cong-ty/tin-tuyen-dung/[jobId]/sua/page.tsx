import { AppShell } from "@/components/app-shell";
import { JobCreateForm } from "@/components/company/job-create-form";
import { RequireAuth } from "@/components/require-auth";

type Props = { params: Promise<{ jobId: string }> };

export default async function EditCompanyJobPage({ params }: Props) {
  const { jobId } = await params;
  return (
    <AppShell>
      <RequireAuth roles={["COMPANY"]}>
        <JobCreateForm jobId={jobId} />
      </RequireAuth>
    </AppShell>
  );
}
