import { AppShell } from "@/components/app-shell";
import { RequireAuth } from "@/components/require-auth";
import { ReviewsQueue } from "@/components/staff/reviews-queue";
import { StaffSubnav } from "@/components/ui/staff-subnav";

export default function StaffReviewsPage() {
  return (
    <AppShell title="Đánh giá" description="Kiểm duyệt đánh giá từ sinh viên.">
      <RequireAuth roles={["STAFF", "SUPER_ADMIN"]}>
        <StaffSubnav />
        <ReviewsQueue />
      </RequireAuth>
    </AppShell>
  );
}
