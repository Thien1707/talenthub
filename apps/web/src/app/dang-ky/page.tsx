import Link from "next/link";
import { Suspense } from "react";
import {
  AuthPageFooter,
  AuthPageHeader,
} from "@/components/auth/auth-page-header";
import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  return (
    <AuthShell>
      <AuthPageHeader
        title="Tạo tài khoản miễn phí"
        lead="Lưu CV, ứng tuyển và nhắn tin với nhà tuyển dụng trên TalentHub."
      />
      <Suspense fallback={<p className="text-sm text-slate-500">Đang tải…</p>}>
        <RegisterForm />
      </Suspense>
      <AuthPageFooter>
        Đã có tài khoản? <Link href="/dang-nhap">Đăng nhập</Link>
      </AuthPageFooter>
    </AuthShell>
  );
}
