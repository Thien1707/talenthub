import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { RequireAuth } from "@/components/require-auth";
import { CvViewPage } from "@/components/student/cv-view-page";

export default async function StudentCvViewOnlyPage({
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
      title="Xem CV"
      description="Xem trước CV đầy đủ — không chỉnh sửa."
      actions={
        <Link href="/sinh-vien/cv" className="text-link">
          ← Danh sách CV
        </Link>
      }
    >
      <RequireAuth roles={["STUDENT"]}>
        <CvViewPage cvId={cvId} jobId={sp.jobId} jobTitle={sp.jobTitle} />
      </RequireAuth>
    </AppShell>
  );
}
