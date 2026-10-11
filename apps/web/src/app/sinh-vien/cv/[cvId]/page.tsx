import Link from "next/link";
import { EmailVerificationBanner } from "@/components/settings/email-verification-banner";
import { RequireAuth } from "@/components/require-auth";
import { CvManager } from "@/components/student/cv-manager";
import { SiteHeader } from "@/components/site-header";

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
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <RequireAuth roles={["STUDENT"]}>
          <EmailVerificationBanner />
          <Link
            href="/sinh-vien/cv"
            className="text-sm text-blue-700 hover:underline"
          >
            ← Quản lý CV
          </Link>
          <h1 className="mb-6 mt-2 text-2xl font-bold text-slate-900">
            Chỉnh sửa CV
          </h1>
          <CvManager
            cvId={cvId}
            jobId={sp.jobId}
            jobTitle={sp.jobTitle}
          />
        </RequireAuth>
      </main>
    </div>
  );
}
