"use client";

import { useQuery } from "@tanstack/react-query";
import { Download, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api/client";
import { cvFileFormatLabel } from "@/lib/cv/upload-cv-file";

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
  const { data, isLoading, isError, refetch } = useQuery({
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

  const openFile = () => {
    const url = data?.signedUrl;
    if (!url) {
      toast.error("Không lấy được link xem file");
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  if (!assetId) {
    return (
      <p className="p-6 text-center text-sm text-slate-600">
        Chưa có file đính kèm.
      </p>
    );
  }

  if (isLoading) {
    return (
      <p className="flex items-center justify-center gap-2 p-12 text-sm text-slate-600">
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
        Đang tải bản xem CV…
      </p>
    );
  }

  if (isError || !data?.signedUrl) {
    return (
      <div className="space-y-3 p-6 text-center text-sm">
        <p className="text-red-700">Không mở được file. Thử lại sau.</p>
        <button type="button" className="button button-secondary" onClick={() => void refetch()}>
          Thử lại
        </button>
      </div>
    );
  }

  const isPdf = mimeType?.includes("pdf") ?? fileName?.toLowerCase().endsWith(".pdf");

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
            onClick={openFile}
          >
            <ExternalLink className="h-4 w-4" aria-hidden />
            Mở tab mới
          </button>
          <button
            type="button"
            className="button button-secondary !py-1.5 !text-sm"
            onClick={openFile}
          >
            <Download className="h-4 w-4" aria-hidden />
            Tải xuống
          </button>
        </div>
      </div>

      {isPdf ? (
        <iframe
          src={data.signedUrl}
          title={fileName ?? "Xem CV PDF"}
          className="min-h-[520px] flex-1 w-full rounded-xl border border-slate-200 bg-white shadow-sm"
        />
      ) : (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-700">
          <p>
            File Word không xem trực tiếp trên trình duyệt — bấm{" "}
            <strong>Mở tab mới</strong> hoặc <strong>Tải xuống</strong>.
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
