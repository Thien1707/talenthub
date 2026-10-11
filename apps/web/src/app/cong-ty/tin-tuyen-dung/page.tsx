import { CompanyJobsPanel } from "@/components/company/jobs-panel";
import { RequireAuth } from "@/components/require-auth";
import { SiteHeader } from "@/components/site-header";

export default function CompanyJobsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <RequireAuth roles={["COMPANY"]}>
          <h1 className="mb-6 text-2xl font-bold">Quản lý tin tuyển dụng</h1>
          <CompanyJobsPanel />
        </RequireAuth>
      </main>
    </div>
  );
}
