import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";

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
    <AppShell
      title={company.companyName}
      description={[company.industry, company.city].filter(Boolean).join(" · ")}
    >
      <article className="th-card mx-auto max-w-3xl">
        {company.website && (
          <a
            href={company.website}
            target="_blank"
            rel="noreferrer"
            className="text-link"
          >
            Website công ty
          </a>
        )}
        {company.description && (
          <p className="mt-6 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
            {company.description}
          </p>
        )}
      </article>
    </AppShell>
  );
}
