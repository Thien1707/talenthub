import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import {
  CompanyPublicProfile,
  type PublicCompanyProfile,
} from "@/components/company/company-public-profile";

async function fetchCompany(companyId: string): Promise<PublicCompanyProfile | null> {
  const base =
    process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";
  const res = await fetch(`${base}/companies/${companyId}/public`, {
    next: { revalidate: 120 },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed");
  return res.json() as Promise<PublicCompanyProfile>;
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
    <AppShell>
      <CompanyPublicProfile company={company} />
    </AppShell>
  );
}
