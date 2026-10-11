import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";

async function fetchCompany(companyId: string) {
  const base =
    process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";
  const res = await fetch(`${base}/companies/${companyId}/public`, {
    next: { revalidate: 120 },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed");
  return res.json() as Promise<{
    companyName: string;
    description?: string | null;
    city?: string | null;
    website?: string | null;
    industry?: string | null;
  }>;
}

export default async function CompanyPublicPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;
  const company = await fetchCompany(companyId);
  if (!company) notFound();

  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-3xl font-bold">{company.companyName}</h1>
        <p className="mt-2 text-slate-600">
          {[company.industry, company.city].filter(Boolean).join(" · ")}
        </p>
        {company.website && (
          <a
            href={company.website}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-block text-blue-700 hover:underline"
          >
            Website
          </a>
        )}
        {company.description && (
          <p className="mt-6 whitespace-pre-wrap text-slate-700">
            {company.description}
          </p>
        )}
      </main>
    </div>
  );
}
