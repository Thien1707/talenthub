"use client";

import { useQuery } from "@tanstack/react-query";
import { Download, ExternalLink, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api, getStoredAccessToken } from "@/lib/api/client";
import { cvFileFormatLabel } from "@/lib/cv/upload-cv-file";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

export function CvUploadPreview({
  assetId,
  mimeType,
  fileName,
  plainTextPreview,
}: {
  assetId?: string;
  mimeType?: string | null;
  fileName?: string | null;
  plainTextPreview?: string | null;
}) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  const { data: signed, isLoading: signing } = useQuery({
    queryKey: ["media", assetId, "signed-url"],
    enabled: Boolean(assetId),
    queryFn: async () => {
      const { data: res } = await api.get<{ signedUrl: string }>(
        `/media/${assetId}/signed-url`,
      );
      return res;
    },
    staleTime: 50 * 60 * 1000,
  });

  const {
    data: previewBlob,
    isLoading: loadingPreview,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["media", assetId, "preview-blob"],
    enabled: Boolean(assetId),
    queryFn: async () => {
      const token = getStoredAccessToken();
      const res = await fetch(`${API_BASE}/media/${assetId}/preview`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: "include",
      });
      if (!res.ok) throw new Error("preview failed");
      return res.blob();
    },
    staleTime: 2 * 60 * 1000,
  });

  useEffect(() => {
    if (!previewBlob) return;
    const url = URL.createObjectURL(previewBlob);
    setObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [previewBlob]);

  const openSigned = () => {
    const url = signed?.signedUrl;
    if (!url) {
      toast.error("Không lấy được link file");
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const downloadBlob = () => {
    if (!previewBlob) {
      openSigned();
      return;
    }
    const url = URL.createObjectURL(previewBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName ?? "cv.pdf";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!assetId) {
    return (
      <p className="p-6 text-center text-sm text-slate-600">
        Chưa có file đính kèm.
      </p>
    );
  }

  const loading = signing || loadingPreview;

  if (loading) {
    return (
      <p className="flex items-center justify-center gap-2 p-12 text-sm text-slate-600">
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
        Đang tải bản xem CV…
      </p>
    );
  }

  if (isError || !previewBlob) {
    return (
      <div className="space-y-3 p-6 text-center text-sm">
        <p className="text-red-700">
          Không hiển thị được file. Thử mở tab mới hoặc tải lại CV.
        </p>
        <div className="flex justify-center gap-2">
          <button
            type="button"
            className="button button-secondary"
            onClick={() => void refetch()}
          >
            Thử lại
          </button>
          {signed?.signedUrl && (
            <button type="button" className="button" onClick={openSigned}>
              Mở tab mới
            </button>
          )}
        </div>
      </div>
    );
  }

  const isPdf =
    mimeType?.includes("pdf") ?? fileName?.toLowerCase().endsWith(".pdf");

  return (
    <div className="flex h-full min-h-[480px] flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <p className="text-sm font-semibold text-slate-800">
          {fileName ?? "CV tải lên"} · {cvFileFormatLabel(mimeType)}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            className="button button-secondary !py-1.5 !text-sm"
            onClick={openSigned}
          >
            <ExternalLink className="h-4 w-4" aria-hidden />
            Mở tab mới
          </button>
          <button
            type="button"
            className="button button-secondary !py-1.5 !text-sm"
            onClick={downloadBlob}
          >
            <Download className="h-4 w-4" aria-hidden />
            Tải xuống
          </button>
        </div>
      </div>

      {isPdf && objectUrl ? (
        <iframe
          src={objectUrl}
          title={fileName ?? "Xem CV PDF"}
          className="min-h-[520px] flex-1 w-full rounded-xl border border-slate-200 bg-white shadow-sm"
        />
      ) : (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-700">
          <p>
            File Word — bấm <strong>Tải xuống</strong> để mở trên máy.
          </p>
          {plainTextPreview?.trim() && (
            <div className="mt-4 max-h-64 overflow-y-auto rounded-lg border bg-white p-3 text-xs leading-relaxed text-slate-600">
              {plainTextPreview.slice(0, 3000)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
