import { CompanyProfileForm } from "@/components/company/profile-form";
import { EmailVerificationBanner } from "@/components/settings/email-verification-banner";
import { RequireAuth } from "@/components/require-auth";
import { SiteHeader } from "@/components/site-header";

export default function CompanyProfilePage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <RequireAuth roles={["COMPANY"]}>
          <EmailVerificationBanner />
          <h1 className="mb-6 text-2xl font-bold text-slate-900">
            Hồ sơ công ty
          </h1>
          <CompanyProfileForm />
        </RequireAuth>
      </main>
    </div>
  );
}
