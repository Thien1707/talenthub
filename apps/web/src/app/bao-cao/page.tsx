"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { AppShell } from "@/components/app-shell";
import { ReportForm } from "@/components/reports/report-form";
import { RequireAuth } from "@/components/require-auth";

function ReportInner() {
  const params = useSearchParams();
  return (
    <ReportForm
      jobId={params.get("jobId") ?? undefined}
      reportedUserId={params.get("userId") ?? undefined}
      messageId={params.get("messageId") ?? undefined}
    />
  );
}

export default function ReportPage() {
  return (
    <AppShell title="Báo cáo vi phạm" description="Gửi báo cáo để Staff xử lý.">
      <RequireAuth roles={["STUDENT", "COMPANY"]}>
        <div className="th-card max-w-2xl">
          <Suspense fallback={<p className="text-sm text-slate-500">Đang tải…</p>}>
            <ReportInner />
          </Suspense>
        </div>
      </RequireAuth>
    </AppShell>
  );
}
