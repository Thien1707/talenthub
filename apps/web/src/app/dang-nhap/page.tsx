import { LoginForm } from "@/components/auth/login-form";
import { SiteHeader } from "@/components/site-header";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />
      <main className="mx-auto max-w-md px-4 py-12">
        <h1 className="mb-6 text-2xl font-bold text-slate-900">Đăng nhập</h1>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <LoginForm />
        </div>
      </main>
    </div>
  );
}
