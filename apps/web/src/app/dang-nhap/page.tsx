import { LoginForm } from "@/components/auth/login-form";
import { AppShell } from "@/components/app-shell";

export default function LoginPage() {
  return (
    <AppShell title="Đăng nhập" narrow>
      <div className="th-card">
        <LoginForm />
      </div>
    </AppShell>
  );
}
