"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Upload, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api/client";
import {
  CV_UPLOAD_ACCEPT,
  formatCvFileSize,
  uploadCvFromComputer,
  validateCvFileClient,
} from "@/lib/cv/upload-cv-file";

function extractApiMessage(err: unknown): string | undefined {
  if (
    err &&
    typeof err === "object" &&
    "response" in err &&
    (err as { response?: { data?: { message?: string | string[] } } }).response
      ?.data?.message
  ) {
    const m = (err as { response: { data: { message: string | string[] } } })
      .response.data.message;
    return Array.isArray(m) ? m[0] : m;
  }
  return undefined;
}

export function CvComputerUpload({
  variant = "panel",
  onUploaded,
}: {
  variant?: "panel" | "compact";
  onUploaded?: (cvId: string) => void;
}) {
  const qc = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [picked, setPicked] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);

  const upload = useMutation({
    mutationFn: () => {
      if (!picked) throw new Error("no file");
      return uploadCvFromComputer(picked, {
        cvName: picked.name.replace(/\.(pdf|docx?|PDF|DOCX?)$/i, ""),
        onProgress: setProgress,
      });
    },
    onSuccess: (data: { cvId?: string | number }) => {
      toast.success("Đã tải CV lên thành công");
      setPicked(null);
      setProgress(0);
      void qc.invalidateQueries({ queryKey: ["cvs", "me"] });
      const id = data?.cvId != null ? String(data.cvId) : undefined;
      if (id) onUploaded?.(id);
    },
    onError: (err: unknown) => {
      setProgress(0);
      toast.error(extractApiMessage(err) ?? "Tải CV thất bại");
    },
  });

  const onPick = (file: File | undefined) => {
    if (!file) return;
    const err = validateCvFileClient(file);
    if (err) {
      toast.error(err);
      return;
    }
    setPicked(file);
  };

  const isCompact = variant === "compact";

  return (
    <div
      className={
        isCompact
          ? "rounded-xl border border-dashed border-emerald-600/40 bg-emerald-50/50 p-4"
          : "mt-6 rounded-xl border border-slate-200 bg-slate-50/80 p-5"
      }
    >
      {!isCompact && (
        <h3 className="text-sm font-bold text-slate-900">
          Tải CV từ máy tính
        </h3>
      )}
      <p className={`text-sm text-slate-600 ${isCompact ? "" : "mt-1"}`}>
        PDF, DOC, DOCX — tối đa 10 MB
      </p>

      {!picked ? (
        <button
          type="button"
          className={`button ${isCompact ? "button-secondary mt-3 w-full justify-center" : "mt-4"}`}
          onClick={() => inputRef.current?.click()}
          disabled={upload.isPending}
        >
          <Upload className="h-4 w-4" aria-hidden />
          Tải CV từ máy tính
        </button>
      ) : (
        <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3 text-sm">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-slate-900">{picked.name}</p>
              <p className="text-slate-600">{formatCvFileSize(picked.size)}</p>
            </div>
            <button
              type="button"
              className="rounded p-1 text-slate-500 hover:bg-slate-100"
              aria-label="Bỏ chọn file"
              disabled={upload.isPending}
              onClick={() => setPicked(null)}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          {upload.isPending && progress > 0 && (
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full bg-emerald-600 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              className="button button-primary text-sm"
              disabled={upload.isPending}
              onClick={() => upload.mutate()}
            >
              {upload.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              )}
              Tải lên
            </button>
            <button
              type="button"
              className="button button-secondary text-sm"
              disabled={upload.isPending}
              onClick={() => inputRef.current?.click()}
            >
              Chọn file khác
            </button>
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={CV_UPLOAD_ACCEPT}
        className="hidden"
        onChange={(e) => {
          onPick(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </div>
  );
}

export async function openOwnedCvFile(assetId: string) {
  const { data } = await api.get<{ signedUrl: string }>(
    `/media/${assetId}/signed-url`,
  );
  window.open(data.signedUrl, "_blank", "noopener,noreferrer");
}
