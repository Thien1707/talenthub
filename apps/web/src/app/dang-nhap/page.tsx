import Link from "next/link";
import {
  AuthPageFooter,
  AuthPageHeader,
} from "@/components/auth/auth-page-header";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <AuthShell>
      <AuthPageHeader
        title="Chào mừng trở lại"
        lead="Đăng nhập để tiếp tục CV, ứng tuyển và tin nhắn."
      />
      <LoginForm />
      <AuthPageFooter>
        Mới dùng TalentHub? <Link href="/dang-ky">Tạo tài khoản miễn phí</Link>
      </AuthPageFooter>
    </AuthShell>
  );
}
