import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { EmailVerificationBanner } from "@/components/settings/email-verification-banner";
import { RequireAuth } from "@/components/require-auth";
import { CvManager } from "@/components/student/cv-manager";
import { StudentSubnav } from "@/components/ui/student-subnav";

export default async function StudentCvEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ cvId: string }>;
  searchParams: Promise<{ jobId?: string; jobTitle?: string }>;
}) {
  const { cvId } = await params;
  const sp = await searchParams;
  return (
    <AppShell
      title="Chỉnh sửa CV"
      description="Soạn nội dung, xem trước, tải PDF và phân tích AI."
      actions={
        <Link href="/sinh-vien/cv" className="text-link">
          ← Danh sách CV
        </Link>
      }
    >
      <RequireAuth roles={["STUDENT"]}>
        <EmailVerificationBanner />
        <StudentSubnav />
        <CvManager cvId={cvId} jobId={sp.jobId} jobTitle={sp.jobTitle} />
      </RequireAuth>
    </AppShell>
  );
}
