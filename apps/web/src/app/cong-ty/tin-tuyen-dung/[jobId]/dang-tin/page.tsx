import { AppShell } from "@/components/app-shell";
import { JobPublishCheckout } from "@/components/company/job-publish-checkout";
import { RequireAuth } from "@/components/require-auth";

type Props = { params: Promise<{ jobId: string }> };

export default async function JobPublishPage({ params }: Props) {
  const { jobId } = await params;
  return (
    <AppShell
      title="Thanh toán & đăng tin"
      description="Xem phí, chọn gói quảng bá và thanh toán từ ví NTD."
    >
      <RequireAuth roles={["COMPANY"]}>
        <JobPublishCheckout jobId={jobId} />
      </RequireAuth>
    </AppShell>
  );
}
