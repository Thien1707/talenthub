import { Suspense } from "react";
import { AppShell } from "@/components/app-shell";
import { PublicJobsList } from "@/components/jobs/public-jobs-list";

export default function JobsPage() {
  return (
    <AppShell>
      <Suspense
        fallback={
          <p className="text-sm font-medium text-slate-500">Đang tải việc làm…</p>
        }
      >
        <PublicJobsList />
      </Suspense>
    </AppShell>
  );
}
