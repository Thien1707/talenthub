import Link from "next/link";
import { notFound } from "next/navigation";
import { CompanyJobApplicantsHint } from "@/components/company/company-job-applicants-hint";
import { ApplyJobPanel } from "@/components/jobs/apply-job-panel";
import { SaveJobButton } from "@/components/jobs/save-job-button";
import { ReportJobLink } from "@/components/reports/report-job-link";
import { SiteHeader } from "@/components/site-header";

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
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <Link href="/viec-lam" className="text-sm text-blue-700 hover:underline">
          ← Danh sách việc làm
        </Link>
        <h1 className="mt-4 text-3xl font-bold">{job.title}</h1>
        <p className="mt-2 text-slate-600">
          {job.company?.companyName} · {job.location}
          {job.jobType === "VIP" && (
            <span className="ml-2 rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
              VIP
            </span>
          )}
        </p>
        <section className="prose mt-8 max-w-none">
          <h2>Mô tả</h2>
          <p className="whitespace-pre-wrap">{job.description}</p>
          <h2>Yêu cầu</h2>
          <p className="whitespace-pre-wrap">{job.requirements}</p>
          {job.benefits && (
            <>
              <h2>Quyền lợi</h2>
              <p className="whitespace-pre-wrap">{job.benefits}</p>
            </>
          )}
        </section>
        <CompanyJobApplicantsHint
          jobId={String(job.jobId)}
          jobTitle={job.title}
        />
        <ApplyJobPanel jobId={String(job.jobId)} jobTitle={job.title} />
        <SaveJobButton jobId={String(job.jobId)} />
        <ReportJobLink jobId={String(job.jobId)} />
        {job.company && (
          <Link
            href={`/cong-ty/${job.company.companyId}`}
            className="mt-4 inline-block text-blue-700 hover:underline"
          >
            Xem công ty
          </Link>
        )}
      </main>
    </div>
  );
}
