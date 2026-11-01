import { api } from "@/lib/api/client";

export const CV_UPLOAD_MAX_BYTES = 10 * 1024 * 1024;
export const CV_UPLOAD_ACCEPT =
  ".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export function formatCvFileSize(bytes: number | string | undefined): string {
  const n = typeof bytes === "string" ? Number(bytes) : (bytes ?? 0);
  if (!n || Number.isNaN(n)) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function cvFileFormatLabel(mimeType?: string | null): string {
  if (!mimeType) return "—";
  if (mimeType.includes("pdf")) return "PDF";
  if (mimeType.includes("wordprocessingml")) return "DOCX";
  if (mimeType.includes("msword")) return "DOC";
  return mimeType.split("/").pop()?.toUpperCase() ?? "File";
}

export function validateCvFileClient(file: File): string | null {
  if (file.size > CV_UPLOAD_MAX_BYTES) {
    return "File vượt quá 10 MB";
  }
  const name = file.name.toLowerCase();
  if (!/\.(pdf|doc|docx)$/.test(name)) {
    return "Chỉ hỗ trợ PDF, DOC, DOCX";
  }
  return null;
}

export async function uploadCvFromComputer(
  file: File,
  options?: {
    cvName?: string;
    cvId?: string;
    onProgress?: (percent: number) => void;
  },
) {
  const form = new FormData();
  form.append("file", file);
  const params = new URLSearchParams();
  if (options?.cvName?.trim()) params.set("cvName", options.cvName.trim());
  if (options?.cvId) params.set("cvId", options.cvId);
  const qs = params.toString();
  const { data } = await api.post(`/cvs/me/upload${qs ? `?${qs}` : ""}`, form, {
    onUploadProgress: (e) => {
      if (e.total && options?.onProgress) {
        options.onProgress(Math.round((e.loaded / e.total) * 100));
      }
    },
  });
  return data;
}
