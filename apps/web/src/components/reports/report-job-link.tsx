"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth-provider";

export function ReportJobLink({ jobId }: { jobId: string }) {
  const { user } = useAuth();
  if (!user || (user.role !== "STUDENT" && user.role !== "COMPANY")) {
    return null;
  }
  return (
    <Link
      href={`/bao-cao?jobId=${encodeURIComponent(jobId)}`}
      className="text-sm font-bold text-red-700 hover:text-red-800 hover:underline"
    >
      Báo cáo tin vi phạm
    </Link>
  );
}
