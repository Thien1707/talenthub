"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CvAiPanel } from "@/components/student/cv-ai-panel";
import { CvDesignPanel } from "@/components/student/cv-design-panel";
import { CvEditorLayout } from "@/components/student/cv-editor-layout";
import {
  CvFullBuilder,
  emptyBuilderContent,
} from "@/components/student/cv-full-builder";
import { CvPreview } from "@/components/student/cv-preview";
import { api, getStoredAccessToken } from "@/lib/api/client";
import { normalizeCvContentJson } from "@/lib/cv/normalize-content";
import type { CvTemplateItem } from "@/components/student/cv-template-gallery";
import { resolveSectionOrder } from "@/lib/cv/section-order";
import { patchPersonal } from "@/lib/cv/edit-personal";
import { templateAccentColor } from "@/lib/cv/template-config";
import { resolveCvLayout, type CvContent } from "@/lib/cv/types";

type CvDetail = {
  cvId: string;
  cvName: string;
  templateId?: string;
  template?: {
    templateId?: string;
    templateName?: string;
    templateConfig?: unknown;
  } | null;
  currentVersion?: {
    cvVersionId?: string;
    sourceType?: string;
    contentJson?: unknown;
    fileAsset?: { assetId?: string; originalFilename?: string | null };
  };
};

const DEFAULT_ACCENT = "#1e3a5f";

export function CvManager({
  cvId,
  jobId,
  jobTitle,
}: {
  cvId: string;
  jobId?: string;
  jobTitle?: string;
}) {
  const qc = useQueryClient();
  const [cvName, setCvName] = useState("");
  const [content, setContent] = useState<CvContent>(emptyBuilderContent());
  const [previewScale, setPreviewScale] = useState(100);
  const [editOnCv, setEditOnCv] = useState(true);

  const { data: cv, isLoading, isError } = useQuery({
    queryKey: ["cvs", cvId],
    queryFn: async () => {
      const { data } = await api.get<CvDetail>(`/cvs/me/${cvId}`);
      return data;
    },
  });

  const { data: templates } = useQuery({
    queryKey: ["cvs", "templates"],
    queryFn: async () => {
      const { data } = await api.get<CvTemplateItem[]>("/cvs/templates");
      return data;
    },
  });

  useEffect(() => {
    if (cv) {
      setCvName(cv.cvName);
      if (cv.currentVersion?.contentJson) {
        setContent(normalizeCvContentJson(cv.currentVersion.contentJson));
      } else if (cv.currentVersion?.sourceType === "UPLOAD") {
        setContent(emptyBuilderContent());
      }
    }
  }, [cv]);

  const accent =
    content.design?.accentColor ??
    templateAccentColor(cv?.template?.templateConfig, DEFAULT_ACCENT);

  const setAccent = (accentColor: string) => {
    setContent((c) => ({
      ...c,
      design: { ...c.design, accentColor },
    }));
  };

  const setSectionOrder = (sectionOrder: ReturnType<typeof resolveSectionOrder>) => {
    setContent((c) => ({
      ...c,
      design: { ...c.design, sectionOrder },
    }));
  };

  const changeTemplate = useMutation({
    mutationFn: (templateId: string) =>
      api.patch(`/cvs/me/${cvId}`, { templateId }),
    onSuccess: (_data, templateId) => {
      toast.success("Đã đổi mẫu CV");
      const picked = templates?.find((t) => t.templateId === templateId);
      if (picked?.templateConfig) {
        const nextAccent = templateAccentColor(picked.templateConfig, DEFAULT_ACCENT);
        setContent((c) => ({
          ...c,
          design: { ...c.design, accentColor: nextAccent },
        }));
      }
      void qc.invalidateQueries({ queryKey: ["cvs", cvId] });
    },
    onError: () => toast.error("Không đổi được mẫu"),
  });

  const updateCv = useMutation({
    mutationFn: () =>
      api.patch(`/cvs/me/${cvId}`, { cvName, contentJson: content }),
    onSuccess: () => {
      toast.success("Đã lưu phiên bản CV mới");
      void qc.invalidateQueries({ queryKey: ["cvs", cvId] });
      void qc.invalidateQueries({ queryKey: ["cvs", "me"] });
    },
  });

  const versionId = cv?.currentVersion?.cvVersionId;
  const isUpload = cv?.currentVersion?.sourceType === "UPLOAD";

  const uploadPdf = useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append("file", file);
      const base =
        process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";
      const token = getStoredAccessToken();
      const q = new URLSearchParams({ cvName });
      q.set("cvId", cvId);
      const res = await fetch(`${base}/cvs/me/upload?${q.toString()}`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: "include",
        body: form,
      });
      if (!res.ok) throw new Error("upload failed");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Đã upload CV PDF (trích text cho AI)");
      void qc.invalidateQueries({ queryKey: ["cvs", cvId] });
      void qc.invalidateQueries({ queryKey: ["cvs", "me"] });
    },
    onError: () =>
      toast.error("Upload thất bại — kiểm tra CLOUDINARY_* trên API"),
  });

  const openUploadedCv = async () => {
    const assetId = cv?.currentVersion?.fileAsset?.assetId;
    if (!assetId) return;
    const { data } = await api.get<{ signedUrl: string }>(
      `/media/${assetId}/signed-url`,
    );
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };

  const downloadPdf = async () => {
    const base =
      process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";
    const token = getStoredAccessToken();
    const res = await fetch(`${base}/cvs/me/${cvId}/export/pdf`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      credentials: "include",
    });
    const contentType = res.headers.get("content-type") ?? "";
    if (!res.ok || !contentType.includes("application/pdf")) {
      toast.error("Xuất PDF thất bại — hãy restart API và thử lại");
      return;
    }
    const blob = await res.blob();
    if (blob.size < 100) {
      toast.error("File PDF không hợp lệ");
      return;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${cvName || "cv"}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return <p className="text-slate-600">Đang tải CV…</p>;
  }
  if (isError || !cv) {
    return <p className="text-red-600">Không tìm thấy CV.</p>;
  }

  const layout = resolveCvLayout(cv.template?.templateConfig);
  const selectedTemplateId =
    cv.templateId ?? cv.template?.templateId ?? undefined;
  const sectionOrder = resolveSectionOrder(content);

  const toolbar = (
    <>
      <input
        className="min-w-[140px] flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-900"
        value={cvName}
        onChange={(e) => setCvName(e.target.value)}
        aria-label="Tên CV"
      />
      {!isUpload && (
        <button
          type="button"
          onClick={() => setEditOnCv((v) => !v)}
          className={`rounded-lg border px-3 py-1.5 text-sm ${
            editOnCv
              ? "border-blue-600 bg-blue-50 text-blue-900"
              : "border-slate-300 bg-white text-slate-800"
          }`}
        >
          {editOnCv ? "Đang sửa trên CV" : "Chỉ xem CV"}
        </button>
      )}
      <button
        type="button"
        disabled={updateCv.isPending || isUpload}
        onClick={() => updateCv.mutate()}
        className="rounded-lg bg-blue-700 px-3 py-1.5 text-sm text-white disabled:opacity-50"
      >
        {updateCv.isPending && (
          <Loader2 className="mr-1 inline h-4 w-4 animate-spin" />
        )}
        Lưu
      </button>
      <button
        type="button"
        disabled={isUpload}
        onClick={() => void downloadPdf()}
        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-800 disabled:opacity-50"
      >
        Tải PDF
      </button>
      <label className="flex cursor-pointer items-center gap-1 rounded-lg border border-emerald-700 px-3 py-1.5 text-sm text-emerald-900 hover:bg-emerald-50">
        <Upload className="h-4 w-4" />
        {uploadPdf.isPending ? "…" : "PDF"}
        <input
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) uploadPdf.mutate(f);
            e.target.value = "";
          }}
        />
      </label>
    </>
  );

  return (
    <div className="space-y-4">
      {jobTitle && (
        <p className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-950">
          Gợi ý ứng tuyển: <strong>{jobTitle}</strong> — lưu CV rồi quay lại trang việc.
        </p>
      )}

      {isUpload && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950">
          Phiên bản hiện tại là file PDF
          {cv.currentVersion?.fileAsset?.originalFilename
            ? `: ${cv.currentVersion.fileAsset.originalFilename}`
            : ""}
          .{" "}
          <button
            type="button"
            className="font-medium underline"
            onClick={() => void openUploadedCv()}
          >
            Mở file
          </button>
          — tạo CV builder mới nếu muốn soạn trực tiếp trên web.
        </div>
      )}

      <CvEditorLayout
        showContentEditor={!isUpload}
        toolbar={toolbar}
        contentPanel={<CvFullBuilder content={content} onChange={setContent} />}
        designPanel={
          <CvDesignPanel
            layout={layout}
            templateName={cv.template?.templateName}
            templates={templates}
            selectedTemplateId={selectedTemplateId}
            onTemplateSelect={(id) => {
              if (id !== selectedTemplateId) changeTemplate.mutate(id);
            }}
            templateChangePending={changeTemplate.isPending}
            accentColor={accent}
            onAccentChange={setAccent}
            sectionOrder={sectionOrder}
            onSectionOrderChange={setSectionOrder}
            previewScale={previewScale}
            onPreviewScaleChange={setPreviewScale}
          />
        }
        aiPanel={
          <CvAiPanel
            cvVersionId={versionId}
            jobId={jobId}
            jobTitle={jobTitle}
            content={content}
            onApplyContent={setContent}
          />
        }
        previewPanel={
          <CvPreview
            layout={layout}
            content={content}
            cvName={cvName}
            accentColor={accent}
            scale={previewScale}
            showLabel={!isUpload}
            editable={!isUpload && editOnCv}
            onEditPersonal={(key, value) => {
              setContent((c) => patchPersonal(c, key, value));
              if (key === "fullName" && value.trim()) setCvName(value.trim());
            }}
          />
        }
      />
    </div>
  );
}
