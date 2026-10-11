import { RequireAuth } from "@/components/require-auth";
import { ChangePasswordForm } from "@/components/settings/change-password-form";
import { SiteHeader } from "@/components/site-header";

export default function ChangePasswordPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <RequireAuth>
          <h1 className="mb-6 text-2xl font-bold text-slate-900">Đổi mật khẩu</h1>
          <ChangePasswordForm />
        </RequireAuth>
      </main>
    </div>
  );
}
