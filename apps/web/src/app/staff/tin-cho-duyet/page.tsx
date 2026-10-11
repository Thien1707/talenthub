import { RequireAuth } from "@/components/require-auth";
import { SiteHeader } from "@/components/site-header";
import { ModerationPanel } from "@/components/staff/moderation-panel";

export default function StaffModerationPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <RequireAuth roles={["STAFF", "SUPER_ADMIN"]}>
          <h1 className="mb-6 text-2xl font-bold">Tin chờ duyệt</h1>
          <ModerationPanel />
        </RequireAuth>
      </main>
    </div>
  );
}
