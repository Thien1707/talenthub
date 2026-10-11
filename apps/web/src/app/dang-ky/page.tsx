import { Suspense } from "react";
import { RegisterForm } from "@/components/auth/register-form";
import { SiteHeader } from "@/components/site-header";

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />
      <main className="mx-auto max-w-md px-4 py-12">
        <h1 className="mb-6 text-2xl font-bold text-slate-900">Đăng ký</h1>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <Suspense fallback={<p className="text-sm text-slate-500">Đang tải...</p>}>
            <RegisterForm />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
