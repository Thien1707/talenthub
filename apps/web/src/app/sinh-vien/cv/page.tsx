import { EmailVerificationBanner } from "@/components/settings/email-verification-banner";
import { RequireAuth } from "@/components/require-auth";
import { CvListPanel } from "@/components/student/cv-list-panel";
import { SiteHeader } from "@/components/site-header";

export default async function StudentCvListPage({
  searchParams,
}: {
  searchParams: Promise<{ jobId?: string; jobTitle?: string }>;
}) {
  const sp = await searchParams;
  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <RequireAuth roles={["STUDENT"]}>
          <EmailVerificationBanner />
          <h1 className="mb-2 text-2xl font-bold text-slate-900">
            Quản lý CV
          </h1>
          <p className="mb-6 text-sm text-slate-600">
            Tạo, sửa, nhân bản và xóa CV trước khi ứng tuyển.
          </p>
          <CvListPanel jobId={sp.jobId} jobTitle={sp.jobTitle} />
        </RequireAuth>
      </main>
    </div>
  );
}
