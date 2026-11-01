"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/components/auth-provider";
import { api } from "@/lib/api/client";
import styles from "./apply-job-panel.module.css";

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

  const selected = cvs?.find((c) => c.cvId === cvId) ?? cvs?.[0];
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
      <div className={styles.root}>
        <h3 className={styles.title}>Ứng tuyển</h3>
        <p className={styles.muted}>Đăng nhập để nộp hồ sơ cho vị trí này.</p>
        <Link href="/dang-nhap" className="button button-primary w-full justify-center">
          Đăng nhập
        </Link>
      </div>
    );
  }

  if (user.role !== "STUDENT") {
    return (
      <div className={styles.root}>
        <h3 className={styles.title}>Ứng tuyển</h3>
        <p className={styles.muted}>Chỉ tài khoản sinh viên mới ứng tuyển được.</p>
      </div>
    );
  }

  if (!cvs?.length) {
    return (
      <div className={styles.root}>
        <h3 className={styles.title}>Ứng tuyển</h3>
        <p className={styles.muted}>
          <Link href="/sinh-vien/cv">Tạo CV</Link> trước khi ứng tuyển.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <h3 className={styles.title}>Ứng tuyển</h3>
      <Link
        href={`/sinh-vien/cv?jobId=${encodeURIComponent(jobId)}&jobTitle=${encodeURIComponent(jobTitle)}`}
        className={styles.aiLink}
      >
        Phân tích AI độ phù hợp trước khi nộp
      </Link>
      <label className={styles.label} htmlFor={`cv-${jobId}`}>
        Chọn CV
      </label>
      <select
        id={`cv-${jobId}`}
        className="input-field"
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
        className="button button-primary mt-1 w-full justify-center"
      >
        {apply.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        Nộp hồ sơ
      </button>
    </div>
  );
}
