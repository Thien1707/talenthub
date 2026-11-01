import { CvManager } from "@/components/student/cv-manager";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { RequireAuth } from "@/components/require-auth";

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
      description="Soạn CV trực quan: panel nội dung / thiết kế, xem trước A4, PDF và AI."
      actions={
        <Link href="/sinh-vien/cv" className="text-link">
          ← Danh sách CV
        </Link>
      }
    >
      <RequireAuth>
        <CvManager cvId={cvId} jobId={sp.jobId} jobTitle={sp.jobTitle} />
      </RequireAuth>
    </AppShell>
  );
}
