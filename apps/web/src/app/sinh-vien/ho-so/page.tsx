import { RequireAuth } from "@/components/require-auth";
import { SiteHeader } from "@/components/site-header";
import { StudentProfileForm } from "@/components/student/profile-form";

export default function StudentProfilePage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <RequireAuth roles={["STUDENT"]}>
          <h1 className="mb-6 text-2xl font-bold">Hồ sơ sinh viên</h1>
          <StudentProfileForm />
        </RequireAuth>
      </main>
    </div>
  );
}
