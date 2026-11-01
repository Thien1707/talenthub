"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth-provider";

export function CompanyJobApplicantsHint({
  jobId,
  jobTitle,
}: {
  jobId: string;
  jobTitle: string;
}) {
  const { user, loading } = useAuth();

  if (loading || user?.role !== "COMPANY") return null;

  const q = new URLSearchParams({
    jobId,
    jobTitle,
  });

  return (
    <div className="mb-6 rounded-[var(--th-radius-xl)] border border-violet-200/80 bg-violet-50/90 p-5 text-sm font-medium text-slate-800">
      <p className="font-extrabold text-slate-900">Bạn đang xem tin của công ty mình</p>
      <p className="mt-2 leading-relaxed text-slate-700">
        CV và trạng thái ứng viên nằm ở bảng quản lý, không hiển thị trên trang
        công khai này.
      </p>
      <Link
        href={`/cong-ty/tin-tuyen-dung?${q.toString()}#ung-vien`}
        className="button button-primary mt-4 inline-flex"
      >
        Xem ứng viên &amp; CV
      </Link>
    </div>
  );
}
