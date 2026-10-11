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
    <div className="mt-8 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-slate-900">
      <p className="font-semibold">Bạn đang xem tin của công ty mình</p>
      <p className="mt-1 text-slate-700">
        CV và trạng thái ứng viên nằm ở bảng quản lý, không hiển thị trên trang
        công khai này.
      </p>
      <Link
        href={`/cong-ty/tin-tuyen-dung?${q.toString()}#ung-vien`}
        className="mt-3 inline-block rounded-lg bg-blue-700 px-4 py-2 font-medium text-white hover:bg-blue-800"
      >
        Xem ứng viên &amp; CV →
      </Link>
    </div>
  );
}
