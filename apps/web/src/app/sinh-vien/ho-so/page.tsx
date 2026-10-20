import { AppShell } from "@/components/app-shell";
import { RequireAuth } from "@/components/require-auth";
import { StudentProfileForm } from "@/components/student/profile-form";
import { StudentSubnav } from "@/components/ui/student-subnav";

export default function StudentProfilePage() {
  return (
    <AppShell title="Hồ sơ sinh viên" description="Cập nhật thông tin hiển thị với nhà tuyển dụng.">
      <RequireAuth roles={["STUDENT"]}>
        <StudentSubnav />
        <StudentProfileForm />
      </RequireAuth>
    </AppShell>
  );
}
