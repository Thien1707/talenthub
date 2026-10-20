import { AppShell } from "@/components/app-shell";
import { PublicJobsList } from "@/components/jobs/public-jobs-list";

export default function JobsPage() {
  return (
    <AppShell
      title="Việc làm"
      description="Tìm kiếm cơ hội full-time từ doanh nghiệp đã được kiểm duyệt trên TalentHub."
    >
      <PublicJobsList />
    </AppShell>
  );
}
