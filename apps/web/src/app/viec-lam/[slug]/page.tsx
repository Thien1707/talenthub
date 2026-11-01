import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { CompanyJobApplicantsHint } from "@/components/company/company-job-applicants-hint";
import { ApplyJobPanel } from "@/components/jobs/apply-job-panel";
import { SaveJobButton } from "@/components/jobs/save-job-button";
import { ReportJobLink } from "@/components/reports/report-job-link";
import { formatSalaryRange } from "@/lib/format-money";
import styles from "./job-detail.module.css";

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
      <CompanyJobApplicantsHint
        jobId={String(job.jobId)}
        jobTitle={job.title}
      />

      <div className={styles.layout}>
        <article className={styles.main}>
          <p className={styles.salary}>
            Mức lương: {formatSalaryRange(job.salaryMin, job.salaryMax)}
          </p>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Mô tả công việc</h2>
            <p className={styles.sectionBody}>{job.description}</p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Yêu cầu</h2>
            <p className={styles.sectionBody}>{job.requirements}</p>
          </section>

          {job.benefits ? (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Quyền lợi</h2>
              <p className={styles.sectionBody}>{job.benefits}</p>
            </section>
          ) : null}
        </article>

        <aside className={styles.sidebar}>
          <div className={styles.sideCard}>
            <ApplyJobPanel jobId={String(job.jobId)} jobTitle={job.title} />
            <div className={styles.sideActions}>
              <SaveJobButton jobId={String(job.jobId)} />
              <div className={styles.sideLinks}>
                <ReportJobLink jobId={String(job.jobId)} />
                {job.company ? (
                  <Link href={`/cong-ty/${job.company.companyId}`} className="text-link">
                    Xem công ty
                  </Link>
                ) : null}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
