"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { EmailVerificationBanner } from "@/components/settings/email-verification-banner";
import { RequireAuth } from "@/components/require-auth";
import { StudentSubnav } from "@/components/ui/student-subnav";
import { api } from "@/lib/api/client";

export default function SavedJobsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["saved-jobs"],
    queryFn: async () => {
      const { data } = await api.get<
        Array<{
          jobId: string;
          job: { title: string; slug: string; company?: { companyName: string } };
        }>
      >("/saved-jobs");
      return data;
    },
  });

  return (
    <AppShell title="Việc đã lưu" description="Danh sách tin bạn đã lưu để xem sau.">
      <RequireAuth roles={["STUDENT"]}>
        <EmailVerificationBanner />
        <StudentSubnav />
        {isLoading && <p className="text-sm text-slate-500">Đang tải…</p>}
        <ul className="grid gap-4 md:grid-cols-2">
          {data?.map((row) => (
            <li key={row.jobId} className="job-card">
              <Link
                href={`/viec-lam/${row.job.slug}`}
                className="text-lg font-bold text-slate-900 hover:text-blue-600"
              >
                {row.job.title}
              </Link>
              <p className="mt-2 text-sm text-slate-600">
                {row.job.company?.companyName}
              </p>
            </li>
          ))}
        </ul>
      </RequireAuth>
    </AppShell>
  );
}
