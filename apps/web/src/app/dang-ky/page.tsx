import { Suspense } from "react";
import { RegisterForm } from "@/components/auth/register-form";
import { AppShell } from "@/components/app-shell";

export default function RegisterPage() {
  return (
    <AppShell title="Đăng ký" description="Tạo tài khoản sinh viên hoặc nhà tuyển dụng." narrow>
      <div className="th-card">
        <Suspense fallback={<p className="text-sm text-slate-500">Đang tải…</p>}>
          <RegisterForm />
        </Suspense>
      </div>
    </AppShell>
  );
}
