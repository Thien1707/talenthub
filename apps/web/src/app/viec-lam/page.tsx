import { PublicJobsList } from "@/components/jobs/public-jobs-list";
import { SiteHeader } from "@/components/site-header";

export default function JobsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="mb-6 text-2xl font-bold">Việc làm Full-time</h1>
        <PublicJobsList />
      </main>
    </div>
  );
}
