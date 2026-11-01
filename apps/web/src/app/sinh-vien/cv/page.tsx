import { AppShell } from "@/components/app-shell";
import { RequireAuth } from "@/components/require-auth";
import { CvListPanel } from "@/components/student/cv-list-panel";

export default async function StudentCvListPage({
  searchParams,
}: {
  searchParams: Promise<{ jobId?: string; jobTitle?: string }>;
}) {
  const sp = await searchParams;
  return (
    <AppShell>
      <RequireAuth roles={["STUDENT"]}>
        <CvListPanel jobId={sp.jobId} jobTitle={sp.jobTitle} />
      </RequireAuth>
    </AppShell>
  );
}
