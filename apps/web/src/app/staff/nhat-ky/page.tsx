import { RequireAuth } from "@/components/require-auth";
import { SiteHeader } from "@/components/site-header";
import { ModerationLogsPanel } from "@/components/staff/moderation-logs-panel";

export default function StaffLogsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <RequireAuth roles={["STAFF", "SUPER_ADMIN"]}>
          <h1 className="mb-6 text-2xl font-bold text-slate-900">Nhật ký kiểm duyệt</h1>
          <ModerationLogsPanel />
        </RequireAuth>
      </main>
    </div>
  );
}
