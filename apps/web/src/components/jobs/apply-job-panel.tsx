"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/components/auth-provider";
import { api } from "@/lib/api/client";

export function ApplyJobPanel({
  jobId,
  jobTitle,
}: {
  jobId: string;
  jobTitle: string;
}) {
  const { user, loading } = useAuth();
  const [cvId, setCvId] = useState("");

  const { data: cvs } = useQuery({
    queryKey: ["cvs", "me"],
    enabled: user?.role === "STUDENT",
    queryFn: async () => {
      const { data } = await api.get<
        Array<{
          cvId: string;
          cvName: string;
          currentVersion?: { cvVersionId: string; sourceType?: string };
        }>
      >("/cvs/me");
      return data;
    },
  });

  const selected =
    cvs?.find((c) => c.cvId === cvId) ?? cvs?.[0];
  const versionId = selected?.currentVersion?.cvVersionId;

  const apply = useMutation({
    mutationFn: (cvVersionId: string) =>
      api.post("/applications", { jobId, cvVersionId }),
    onSuccess: () => toast.success(`Đã ứng tuyển: ${jobTitle}`),
    onError: () => toast.error("Ứng tuyển thất bại hoặc đã nộp trước đó"),
  });

  if (loading) return null;
  if (!user) {
    return (
      <Link
        href="/dang-nhap"
        className="inline-block rounded-lg bg-blue-700 px-4 py-2 text-white hover:bg-blue-800"
      >
        Đăng nhập để ứng tuyển
      </Link>
    );
  }
  if (user.role !== "STUDENT") {
    return (
      <p className="text-sm text-slate-600">
        Chỉ tài khoản sinh viên mới ứng tuyển được.
      </p>
    );
  }

  if (!cvs?.length) {
    return (
      <div className="mt-8 rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="font-semibold text-slate-900">Ứng tuyển</h3>
        <p className="mt-2 text-sm text-slate-600">
          <Link href="/sinh-vien/cv" className="text-blue-700 hover:underline">
            Tạo CV
          </Link>{" "}
          trước khi ứng tuyển.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-8 rounded-xl border border-slate-200 bg-white p-4">
      <h3 className="font-semibold text-slate-900">Ứng tuyển</h3>
      <Link
        href={`/sinh-vien/cv?jobId=${encodeURIComponent(jobId)}&jobTitle=${encodeURIComponent(jobTitle)}`}
        className="mt-1 inline-block text-sm text-violet-700 hover:underline"
      >
        Phân tích AI độ phù hợp trước khi nộp
      </Link>
      <label className="mt-3 block text-sm font-medium text-slate-800">
        Chọn CV
      </label>
      <select
        className="mt-1 w-full rounded-lg border px-3 py-2 text-slate-900"
        value={cvId || cvs[0]!.cvId}
        onChange={(e) => setCvId(e.target.value)}
      >
        {cvs.map((c) => (
          <option key={c.cvId} value={c.cvId}>
            {c.cvName}
            {c.currentVersion?.sourceType === "UPLOAD" ? " (PDF)" : ""}
          </option>
        ))}
      </select>
      <button
        type="button"
        disabled={!versionId || apply.isPending}
        onClick={() => versionId && apply.mutate(versionId)}
        className="mt-3 flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm text-white hover:bg-blue-800 disabled:opacity-60"
      >
        {apply.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        Nộp hồ sơ
      </button>
    </div>
  );
}
