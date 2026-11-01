"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/components/auth-provider";
import { CvComputerUpload } from "@/components/student/cv-computer-upload";
import { api } from "@/lib/api/client";
import { cvFileFormatLabel } from "@/lib/cv/upload-cv-file";
import styles from "./apply-job-panel.module.css";

type CvRow = {
  cvId: string;
  cvName: string;
  currentVersion?: {
    cvVersionId: string;
    sourceType?: string;
    fileAsset?: {
      mimeType?: string | null;
      originalFilename?: string | null;
    } | null;
  };
};

export function ApplyJobPanel({
  jobId,
  jobTitle,
}: {
  jobId: string;
  jobTitle: string;
}) {
  const { user, loading } = useAuth();
  const qc = useQueryClient();
  const [cvId, setCvId] = useState("");
  const [sourceTab, setSourceTab] = useState<"builder" | "upload">("builder");

  const { data: cvs, isLoading: cvsLoading } = useQuery({
    queryKey: ["cvs", "me"],
    enabled: user?.role === "STUDENT",
    queryFn: async () => {
      const { data } = await api.get<CvRow[]>("/cvs/me");
      return data;
    },
  });

  const builderCvs = useMemo(
    () => cvs?.filter((c) => c.currentVersion?.sourceType !== "UPLOAD") ?? [],
    [cvs],
  );
  const uploadCvs = useMemo(
    () => cvs?.filter((c) => c.currentVersion?.sourceType === "UPLOAD") ?? [],
    [cvs],
  );

  useEffect(() => {
    if (builderCvs.length === 0 && uploadCvs.length > 0) {
      setSourceTab("upload");
    } else if (uploadCvs.length === 0 && builderCvs.length > 0) {
      setSourceTab("builder");
    }
  }, [builderCvs.length, uploadCvs.length]);

  const activeList = sourceTab === "builder" ? builderCvs : uploadCvs;
  const selected =
    activeList.find((c) => c.cvId === cvId) ?? activeList[0] ?? undefined;
  const versionId = selected?.currentVersion?.cvVersionId;

  const apply = useMutation({
    mutationFn: (cvVersionId: string) =>
      api.post("/applications", { jobId, cvVersionId }),
    onSuccess: () => toast.success(`Đã ứng tuyển: ${jobTitle}`),
    onError: (err: unknown) => {
      const msg =
        err &&
        typeof err === "object" &&
        "response" in err &&
        (err as { response?: { data?: { message?: string } } }).response?.data
          ?.message;
      toast.error(
        typeof msg === "string" ? msg : "Ứng tuyển thất bại hoặc đã nộp trước đó",
      );
    },
  });

  if (loading) return null;

  if (!user) {
    return (
      <div className={styles.root}>
        <h3 className={styles.title}>Ứng tuyển</h3>
        <p className={styles.muted}>Đăng nhập để nộp hồ sơ cho vị trí này.</p>
        <Link
          href="/dang-nhap"
          className="button button-primary w-full justify-center"
        >
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

  if (cvsLoading) {
    return (
      <div className={styles.root}>
        <p className={styles.muted}>
          <Loader2 className="mr-1 inline h-4 w-4 animate-spin" />
          Đang tải CV…
        </p>
      </div>
    );
  }

  const hasAnyCv = (cvs?.length ?? 0) > 0;

  return (
    <div className={styles.root}>
      <h3 className={styles.title}>Ứng tuyển ngay</h3>
      <Link
        href={`/sinh-vien/cv?jobId=${encodeURIComponent(jobId)}&jobTitle=${encodeURIComponent(jobTitle)}`}
        className={styles.aiLink}
      >
        Phân tích AI độ phù hợp trước khi nộp
      </Link>

      <div className={styles.tabRow} role="tablist" aria-label="Loại CV">
        <button
          type="button"
          role="tab"
          aria-selected={sourceTab === "builder"}
          className={
            sourceTab === "builder" ? styles.tabActive : styles.tab
          }
          onClick={() => {
            setSourceTab("builder");
            setCvId("");
          }}
        >
          CV trên TalentHub
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={sourceTab === "upload"}
          className={sourceTab === "upload" ? styles.tabActive : styles.tab}
          onClick={() => {
            setSourceTab("upload");
            setCvId("");
          }}
        >
          CV tải lên
        </button>
      </div>

      {sourceTab === "builder" && builderCvs.length === 0 && (
        <p className={styles.muted}>
          Chưa có CV builder.{" "}
          <Link href="/sinh-vien/cv">Tạo CV trên TalentHub</Link> hoặc chuyển
          sang tab CV tải lên.
        </p>
      )}

      {sourceTab === "upload" && uploadCvs.length === 0 && !hasAnyCv && (
        <p className={styles.muted}>Tải CV từ máy tính để ứng tuyển.</p>
      )}

      {activeList.length > 0 && (
        <>
          <label className={styles.label} htmlFor={`cv-${jobId}`}>
            Chọn CV để nộp
          </label>
          <select
            id={`cv-${jobId}`}
            className="input-field"
            value={cvId || activeList[0]!.cvId}
            onChange={(e) => setCvId(e.target.value)}
          >
            {activeList.map((c) => (
              <option key={c.cvId} value={c.cvId}>
                {c.cvName}
                {c.currentVersion?.sourceType === "UPLOAD"
                  ? ` (${cvFileFormatLabel(c.currentVersion.fileAsset?.mimeType)})`
                  : ""}
              </option>
            ))}
          </select>
        </>
      )}

      {sourceTab === "upload" && (
        <CvComputerUpload
          variant="compact"
          onUploaded={(id) => {
            void qc.invalidateQueries({ queryKey: ["cvs", "me"] });
            setSourceTab("upload");
            setCvId(id);
          }}
        />
      )}

      <button
        type="button"
        disabled={!versionId || apply.isPending}
        onClick={() => {
          if (!versionId) {
            toast.error("Hãy chọn hoặc tải lên một CV trước khi nộp");
            return;
          }
          apply.mutate(versionId);
        }}
        className="button button-primary mt-1 w-full justify-center"
      >
        {apply.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        Nộp hồ sơ
      </button>
    </div>
  );
}
