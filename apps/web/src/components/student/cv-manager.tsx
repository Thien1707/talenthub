"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CvAiPanel } from "@/components/student/cv-ai-panel";
import {
  CvFullBuilder,
  emptyBuilderContent,
} from "@/components/student/cv-full-builder";
import { CvPreview } from "@/components/student/cv-preview";
import { api, getStoredAccessToken } from "@/lib/api/client";
import { resolveCvLayout, type CvContent } from "@/lib/cv/types";

type CvDetail = {
  cvId: string;
  cvName: string;
  template?: { templateName?: string; templateConfig?: unknown } | null;
  currentVersion?: {
    cvVersionId?: string;
    sourceType?: string;
    contentJson?: CvContent;
    fileAsset?: { assetId?: string; originalFilename?: string | null };
  };
};

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

  const { data: cv, isLoading, isError } = useQuery({
    queryKey: ["cvs", cvId],
    queryFn: async () => {
      const { data } = await api.get<CvDetail>(`/cvs/me/${cvId}`);
      return data;
    },
  });

  useEffect(() => {
    if (cv) {
      setCvName(cv.cvName);
      if (cv.currentVersion?.contentJson) {
        setContent(cv.currentVersion.contentJson as CvContent);
      } else if (cv.currentVersion?.sourceType === "UPLOAD") {
        setContent(emptyBuilderContent());
      }
    }
  }, [cv]);

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

  return (
    <div className="space-y-6">
      {cv.template?.templateName && (
        <p className="text-sm text-slate-600">
          Mẫu: <strong>{cv.template.templateName}</strong> · chọn mẫu khác khi
          tạo CV mới tại trang quản lý.
        </p>
      )}

      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[200px] flex-1">
          <label className="text-sm font-medium text-slate-800">Tên CV</label>
          <input
            className="mt-1 w-full rounded-lg border px-3 py-2 text-slate-900"
            value={cvName}
            onChange={(e) => setCvName(e.target.value)}
          />
        </div>
        <button
          type="button"
          disabled={updateCv.isPending}
          onClick={() => updateCv.mutate()}
          className="rounded-lg bg-blue-700 px-4 py-2 text-white"
        >
          {updateCv.isPending && (
            <Loader2 className="mr-1 inline h-4 w-4 animate-spin" />
          )}
          Lưu
        </button>
        <button
          type="button"
          onClick={() => void downloadPdf()}
          className="rounded-lg border border-slate-400 px-4 py-2 text-slate-800"
        >
          Tải PDF (builder)
        </button>
        <label className="flex cursor-pointer items-center gap-1 rounded-lg border border-emerald-700 px-4 py-2 text-emerald-900 hover:bg-emerald-50">
          <Upload className="h-4 w-4" />
          {uploadPdf.isPending ? "Đang upload…" : "Upload PDF"}
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
      </div>

      {cv.currentVersion?.sourceType === "UPLOAD" && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950">
          Phiên bản hiện tại là file PDF đã upload
          {cv.currentVersion.fileAsset?.originalFilename
            ? `: ${cv.currentVersion.fileAsset.originalFilename}`
            : ""}
          .{" "}
          <button
            type="button"
            className="font-medium underline"
            onClick={() => void openUploadedCv()}
          >
            Mở / tải (URL ký)
          </button>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-6">
          {cv.currentVersion?.sourceType !== "UPLOAD" && (
            <CvFullBuilder content={content} onChange={setContent} />
          )}
          <CvAiPanel cvVersionId={versionId} jobId={jobId} jobTitle={jobTitle} />
        </div>
        <div className="lg:sticky lg:top-6 lg:self-start">
          <CvPreview layout={layout} content={content} cvName={cvName} />
        </div>
      </div>
    </div>
  );
}
