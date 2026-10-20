import { AppShell } from "@/components/app-shell";
import { EmailVerificationBanner } from "@/components/settings/email-verification-banner";
import { RequireAuth } from "@/components/require-auth";
import { CvListPanel } from "@/components/student/cv-list-panel";
import { StudentSubnav } from "@/components/ui/student-subnav";

export default async function StudentCvListPage({
  searchParams,
}: {
  searchParams: Promise<{ jobId?: string; jobTitle?: string }>;
}) {
  const sp = await searchParams;
  return (
    <AppShell
      title="Quản lý CV"
      description="Tạo, sửa, nhân bản và xóa CV trước khi ứng tuyển."
    >
      <RequireAuth roles={["STUDENT"]}>
        <EmailVerificationBanner />
        <StudentSubnav />
        <CvListPanel jobId={sp.jobId} jobTitle={sp.jobTitle} />
      </RequireAuth>
    </AppShell>
  );
}
