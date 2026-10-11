import { RequireAuth } from "@/components/require-auth";
import { SiteHeader } from "@/components/site-header";
import { CompanyVerificationPanel } from "@/components/staff/company-verification-panel";

export default function StaffCompanyVerifyPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <RequireAuth roles={["STAFF", "SUPER_ADMIN"]}>
          <h1 className="mb-6 text-2xl font-bold text-slate-900">Xác minh công ty</h1>
          <CompanyVerificationPanel />
        </RequireAuth>
      </main>
    </div>
  );
}
