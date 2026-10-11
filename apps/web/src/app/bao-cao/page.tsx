"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { ReportForm } from "@/components/reports/report-form";
import { RequireAuth } from "@/components/require-auth";
import { SiteHeader } from "@/components/site-header";

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
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <RequireAuth roles={["STUDENT", "COMPANY"]}>
          <h1 className="mb-6 text-2xl font-bold text-slate-900">Báo cáo vi phạm</h1>
          <Suspense fallback={<p>Đang tải...</p>}>
            <ReportInner />
          </Suspense>
        </RequireAuth>
      </main>
    </div>
  );
}
