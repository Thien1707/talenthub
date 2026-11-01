import { AppShell } from "@/components/app-shell";
import { CompanyProfileForm } from "@/components/company/profile-form";
import { RequireAuth } from "@/components/require-auth";

export default function CompanyProfilePage() {
  return (
    <AppShell>
      <RequireAuth roles={["COMPANY"]}>
        <CompanyProfileForm />
      </RequireAuth>
    </AppShell>
  );
}
