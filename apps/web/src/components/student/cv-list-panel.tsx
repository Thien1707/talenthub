"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Eye, FileText, Loader2, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { PageIntroAccent } from "@/components/marketing/page-intro";
import {
  CvTemplateGallery,
  type CvTemplateItem,
} from "@/components/student/cv-template-gallery";
import { CvComputerUpload } from "@/components/student/cv-computer-upload";
import { downloadCvAsset } from "@/lib/cv/download-cv-asset";
import { api } from "@/lib/api/client";
import { resolveCvLayout } from "@/lib/cv/types";
import {
  cvFileFormatLabel,
  formatCvFileSize,
} from "@/lib/cv/upload-cv-file";
import { formatCvEditedRelative } from "@/lib/format-relative";
import styles from "./cv-list-strip.module.css";

type CvItem = {
  cvId: string;
  cvName: string;
  updatedAt: string;
  createdAt?: string;
  template?: { templateName?: string; templateConfig?: unknown } | null;
  currentVersion?: {
    sourceType?: string;
    fileAsset?: {
      assetId?: string;
      mimeType?: string | null;
      fileSize?: string | number | null;
      originalFilename?: string | null;
    } | null;
  };
};

function CvPolaroidThumb({
  templateConfig,
  sourceType,
}: {
  templateConfig?: unknown;
  sourceType?: string;
}) {
  if (sourceType === "UPLOAD") {
    return (
      <div className={`${styles.thumb} ${styles.thumbUpload}`}>
        <FileText size={40} strokeWidth={1.25} aria-hidden />
      </div>
    );
  }

  const layout = resolveCvLayout(templateConfig);
  const accent =
    templateConfig &&
    typeof templateConfig === "object" &&
    ("accentColor" in templateConfig || "primaryColor" in templateConfig)
      ? String(
          (templateConfig as { accentColor?: string; primaryColor?: string })
            .accentColor ??
            (templateConfig as { primaryColor?: string }).primaryColor ??
            "#334155",
        )
      : "#334155";

  if (layout === "topcv") {
    return (
      <div className={styles.thumb}>
        <div className="flex h-full flex-col gap-1.5 p-3">
          <div className="h-2.5 w-2/3 rounded bg-slate-300/90" />
          <div className="h-1.5 w-full rounded bg-slate-200" />
          <div className="mt-auto h-1.5 w-4/5 rounded bg-slate-200" />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.thumb}>
      <div className="flex h-full gap-1.5 p-3">
        <div
          className="w-[32%] rounded-sm"
          style={{ backgroundColor: accent }}
        />
        <div className="flex flex-1 flex-col gap-1.5">
          <div className="h-2 w-full rounded bg-slate-200" />
          <div className="h-1.5 w-4/5 rounded bg-slate-200" />
          <div className="mt-auto h-1.5 w-3/4 rounded bg-slate-200" />
        </div>
      </div>
    </div>
  );
}

export function CvListPanel({
  jobId,
  jobTitle,
}: {
  jobId?: string;
  jobTitle?: string;
}) {
  const router = useRouter();
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("CV mới");
  const [templateId, setTemplateId] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<CvItem | null>(null);

  const { data: cvs, isLoading } = useQuery({
    queryKey: ["cvs", "me"],
    queryFn: async () => {
      const { data } = await api.get<CvItem[]>("/cvs/me");
      return data;
    },
  });

  const { data: templates } = useQuery({
    queryKey: ["cvs", "templates"],
    enabled: createOpen,
    queryFn: async () => {
      const { data } = await api.get<CvTemplateItem[]>("/cvs/templates");
      return data;
    },
  });

  const createCv = useMutation({
    mutationFn: () =>
      api.post("/cvs/me", {
        cvName: newName.trim() || "CV mới",
        templateId: templateId || undefined,
      }),
    onSuccess: (res) => {
      toast.success("Đã tạo CV");
      setCreateOpen(false);
      void qc.invalidateQueries({ queryKey: ["cvs", "me"] });
      const id = String(res.data.cvId);
      const q = jobId
        ? `?jobId=${encodeURIComponent(jobId)}&jobTitle=${encodeURIComponent(jobTitle ?? "")}`
        : "";
      router.push(`/sinh-vien/cv/${id}${q}`);
    },
    onError: () => toast.error("Tạo CV thất bại"),
  });

  const remove = useMutation({
    mutationFn: (cvId: string) => api.delete(`/cvs/me/${cvId}`),
    onMutate: async (cvId) => {
      setDeleteTarget(null);
      await qc.cancelQueries({ queryKey: ["cvs", "me"] });
      const previous = qc.getQueryData<CvItem[]>(["cvs", "me"]);
      qc.setQueryData<CvItem[]>(["cvs", "me"], (old) =>
        old?.filter((c) => c.cvId !== cvId),
      );
      return { previous };
    },
    onSuccess: () => {
      toast.success("Đã xóa CV khỏi danh sách cá nhân");
    },
    onError: (err: unknown, _cvId, context) => {
      if (context?.previous) {
        qc.setQueryData(["cvs", "me"], context.previous);
      }
      const msg =
        err &&
        typeof err === "object" &&
        "response" in err &&
        (err as { response?: { data?: { message?: string } } }).response?.data
          ?.message;
      toast.error(typeof msg === "string" ? msg : "Không xóa được");
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ["cvs", "me"] });
    },
  });

  const editHref = (cvId: string) => {
    const q = new URLSearchParams();
    if (jobId) q.set("jobId", jobId);
    if (jobTitle) q.set("jobTitle", jobTitle);
    const qs = q.toString();
    return `/sinh-vien/cv/${cvId}${qs ? `?${qs}` : ""}`;
  };

  const viewHref = (cvId: string) => {
    const q = new URLSearchParams();
    if (jobId) q.set("jobId", jobId);
    if (jobTitle) q.set("jobTitle", jobTitle);
    const qs = q.toString();
    return `/sinh-vien/cv/${cvId}/xem${qs ? `?${qs}` : ""}`;
  };

  const openCreate = () => {
    setCreateOpen(true);
    setNewName("CV mới");
    setTemplateId("");
  };

  const builderCvs =
    cvs?.filter((c) => c.currentVersion?.sourceType !== "UPLOAD") ?? [];
  const uploadCvs =
    cvs?.filter((c) => c.currentVersion?.sourceType === "UPLOAD") ?? [];

  const renderCvGrid = (items: CvItem[], mode: "builder" | "upload") => (
    <ul className={styles.grid} aria-label="Danh sách CV">
      {mode === "builder" && (
        <li className={styles.card}>
          <button
            type="button"
            className={styles.createCard}
            onClick={openCreate}
          >
            <span className={styles.createThumb} aria-hidden>
              <Plus size={36} strokeWidth={2} />
            </span>
            <span className={styles.createLabel}>CV mới</span>
            <span className={styles.createMeta}>chọn mẫu &amp; chỉnh sửa</span>
          </button>
        </li>
      )}
      {items.map((cv) => {
        const asset = cv.currentVersion?.fileAsset;
        const isUpload = mode === "upload";
        return (
          <li key={cv.cvId} className={styles.card}>
            {isUpload ? (
              <div className={styles.link}>
                <CvPolaroidThumb sourceType="UPLOAD" />
                <span className={styles.title}>{cv.cvName}</span>
                <span className={styles.meta}>
                  {cvFileFormatLabel(asset?.mimeType)} ·{" "}
                  {formatCvFileSize(asset?.fileSize ?? undefined)} · tải lên{" "}
                  {formatCvEditedRelative(cv.updatedAt)}
                </span>
                {asset?.originalFilename && (
                  <span className={styles.fileName}>{asset.originalFilename}</span>
                )}
                <div className={styles.uploadActions}>
                  {asset?.assetId && (
                    <>
                      <Link
                        href={viewHref(cv.cvId)}
                        className={styles.uploadActionBtn}
                      >
                        <Eye size={14} aria-hidden /> Xem
                      </Link>
                      <button
                        type="button"
                        className={styles.uploadActionBtn}
                        onClick={() => {
                          void downloadCvAsset(
                            asset.assetId!,
                            asset.originalFilename ?? `${cv.cvName}.pdf`,
                          ).catch(() =>
                            toast.error("Không tải được file — thử lại sau"),
                          );
                        }}
                      >
                        <Download size={14} aria-hidden /> Tải
                      </button>
                    </>
                  )}
                  <Link href={editHref(cv.cvId)} className={styles.uploadActionBtn}>
                    Phân tích AI
                  </Link>
                </div>
              </div>
            ) : (
              <Link href={editHref(cv.cvId)} className={styles.link}>
                <CvPolaroidThumb
                  templateConfig={cv.template?.templateConfig}
                  sourceType={cv.currentVersion?.sourceType}
                />
                <span className={styles.title}>{cv.cvName}</span>
                <span className={styles.meta}>
                  chỉnh sửa {formatCvEditedRelative(cv.updatedAt)}
                </span>
              </Link>
            )}
            <button
              type="button"
              className={styles.delete}
              aria-label={`Xóa ${cv.cvName}`}
              title="Xóa"
              disabled={remove.isPending}
              onClick={() => setDeleteTarget(cv)}
            >
              <Trash2 size={15} aria-hidden />
            </button>
          </li>
        );
      })}
    </ul>
  );

  return (
    <>
      {jobId && (
        <p className={styles.banner}>
          Bạn đang chọn CV cho tin <strong>{jobTitle ?? jobId}</strong>. Mở CV
          cần dùng rồi quay lại tin tuyển dụng.
        </p>
      )}

      <section
        className={styles.panel}
        aria-labelledby="cv-list-strip-title"
      >
        <header className={styles.header}>
          <p className={styles.eyebrow}>CV của bạn</p>
          <h2 id="cv-list-strip-title" className={styles.heading}>
            Tiếp tục chỗ bạn <PageIntroAccent>dừng lại</PageIntroAccent>
          </h2>
          <p className={styles.lead}>
            Tạo CV trên TalentHub hoặc{" "}
            <strong>tải CV từ máy tính</strong> (PDF, DOC, DOCX) — chọn bản
            phù hợp khi ứng tuyển từng tin.
          </p>
        </header>

        <CvComputerUpload />

        {createOpen && (
          <div className={styles.createPanel}>
            <h3 className={styles.createPanelTitle}>CV mới</h3>
            <label className="mt-4 block text-sm font-bold text-slate-800">
              Tên CV
            </label>
            <input
              className="input-field mt-2 max-w-md"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            {templates && templates.length > 0 && (
              <div className="mt-6">
                <p className="text-sm font-bold text-slate-900">Chọn mẫu</p>
                <div className="mt-3">
                  <CvTemplateGallery
                    templates={templates}
                    selectedId={templateId || undefined}
                    onSelect={(id) =>
                      setTemplateId((prev) => (prev === id ? "" : id))
                    }
                  />
                </div>
              </div>
            )}
            <div className={styles.createActions}>
              <button
                type="button"
                disabled={createCv.isPending}
                onClick={() => createCv.mutate()}
                className="button"
              >
                {createCv.isPending && (
                  <Loader2 className="mr-1 inline h-4 w-4 animate-spin" />
                )}
                Tạo &amp; chỉnh sửa
              </button>
              <button
                type="button"
                className="button button-secondary"
                onClick={() => setCreateOpen(false)}
              >
                Hủy
              </button>
            </div>
          </div>
        )}

        {isLoading && (
          <p className={styles.loading}>
            <Loader2 className="mr-1 inline h-4 w-4 animate-spin" aria-hidden />
            Đang tải CV…
          </p>
        )}

        {!isLoading && (
          <>
            <h3 className={styles.sectionTitle}>CV tạo trên TalentHub</h3>
            {builderCvs.length === 0 ? (
              <p className={styles.sectionEmpty}>
                Chưa có CV builder — bấm <strong>CV mới</strong> hoặc tạo từ
                form phía trên.
              </p>
            ) : (
              renderCvGrid(builderCvs, "builder")
            )}

            <h3 className={styles.sectionTitle}>CV tải lên từ máy tính</h3>
            {uploadCvs.length === 0 ? (
              <p className={styles.sectionEmpty}>
                Chưa có file — dùng <strong>Tải CV từ máy tính</strong> phía
                trên.
              </p>
            ) : (
              renderCvGrid(uploadCvs, "upload")
            )}
          </>
        )}
      </section>

      {deleteTarget ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal
          aria-labelledby="cv-account-delete-title"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <h3
              id="cv-account-delete-title"
              className="text-lg font-semibold text-slate-900"
            >
              Xóa CV này?
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              CV này sẽ bị xóa khỏi danh sách CV cá nhân của bạn. Những hồ sơ
              ứng tuyển đã gửi trước đó vẫn được nhà tuyển dụng xem theo bản CV
              bạn đã nộp.
            </p>
            <p className="mt-2 text-sm font-medium text-slate-800">
              {deleteTarget.cvName}
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                className="button button-secondary"
                disabled={remove.isPending}
                onClick={() => setDeleteTarget(null)}
              >
                Hủy
              </button>
              <button
                type="button"
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                disabled={remove.isPending}
                onClick={() => remove.mutate(deleteTarget.cvId)}
              >
                {remove.isPending ? (
                  <Loader2 className="inline h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  "Xóa CV"
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
