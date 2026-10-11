"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { EmailVerificationBanner } from "@/components/settings/email-verification-banner";
import { RequireAuth } from "@/components/require-auth";
import { SiteHeader } from "@/components/site-header";
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
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <RequireAuth roles={["STUDENT"]}>
          <EmailVerificationBanner />
          <h1 className="mb-6 text-2xl font-bold text-slate-900">Việc đã lưu</h1>
          {isLoading && <p className="text-slate-600">Đang tải...</p>}
          <ul className="space-y-3">
            {data?.map((row) => (
              <li key={row.jobId} className="rounded-xl border bg-white p-4">
                <Link
                  href={`/viec-lam/${row.job.slug}`}
                  className="font-medium text-blue-800 hover:underline"
                >
                  {row.job.title}
                </Link>
                <p className="text-sm text-slate-600">
                  {row.job.company?.companyName}
                </p>
              </li>
            ))}
          </ul>
        </RequireAuth>
      </main>
    </div>
  );
}
