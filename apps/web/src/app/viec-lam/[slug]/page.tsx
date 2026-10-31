import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { CompanyJobApplicantsHint } from "@/components/company/company-job-applicants-hint";
import { ApplyJobPanel } from "@/components/jobs/apply-job-panel";
import { SaveJobButton } from "@/components/jobs/save-job-button";
import { ReportJobLink } from "@/components/reports/report-job-link";
import { formatSalaryRange } from "@/lib/format-money";

async function fetchJob(slug: string) {
  const base =
    process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";
  const res = await fetch(`${base}/jobs/slug/${encodeURIComponent(slug)}`, {
    next: { revalidate: 60 },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed");
  return res.json() as Promise<{
    jobId: string;
    title: string;
    description: string;
    requirements: string;
    benefits?: string | null;
    location: string;
    jobType: string;
    salaryMin?: string | null;
    salaryMax?: string | null;
    company?: { companyName: string; companyId: string };
  }>;
}

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const job = await fetchJob(slug);
  if (!job) notFound();

  return (
    <AppShell
      title={job.title}
      description={`${job.company?.companyName ?? ""} · ${job.location}${job.jobType === "VIP" ? " · VIP" : ""}`}
      actions={
        <Link href="/viec-lam" className="text-link">
          ← Danh sách việc làm
        </Link>
      }
    >
      <article className="th-card mx-auto max-w-3xl space-y-8">
        <p className="text-sm font-semibold text-blue-700">
          Mức lương: {formatSalaryRange(job.salaryMin, job.salaryMax)}
        </p>
        <section>
          <h2 className="text-lg font-bold text-slate-900">Mô tả công việc</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
            {job.description}
          </p>
        </section>
        <section>
          <h2 className="text-lg font-bold text-slate-900">Yêu cầu</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
            {job.requirements}
          </p>
        </section>
        {job.benefits && (
          <section>
            <h2 className="text-lg font-bold text-slate-900">Quyền lợi</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
              {job.benefits}
            </p>
          </section>
        )}
        <div className="flex flex-wrap gap-3 border-t border-slate-100 pt-6">
          <CompanyJobApplicantsHint
            jobId={String(job.jobId)}
            jobTitle={job.title}
          />
          <ApplyJobPanel jobId={String(job.jobId)} jobTitle={job.title} />
          <SaveJobButton jobId={String(job.jobId)} />
          <ReportJobLink jobId={String(job.jobId)} />
          {job.company && (
            <Link href={`/cong-ty/${job.company.companyId}`} className="text-link">
              Xem công ty
            </Link>
          )}
        </div>
      </article>
    </AppShell>
  );
}
