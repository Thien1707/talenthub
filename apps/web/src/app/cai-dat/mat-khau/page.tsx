import { AppShell } from "@/components/app-shell";
import { RequireAuth } from "@/components/require-auth";
import { ChangePasswordForm } from "@/components/settings/change-password-form";

export default function ChangePasswordPage() {
  return (
    <AppShell title="Đổi mật khẩu" description="Cập nhật mật khẩu đăng nhập của bạn." narrow>
      <RequireAuth>
        <div className="th-card">
          <ChangePasswordForm />
        </div>
      </RequireAuth>
    </AppShell>
  );
}
