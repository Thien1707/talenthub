"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, FileText, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api/client";

type CvItem = {
  cvId: string;
  cvName: string;
  updatedAt: string;
  template?: { templateName?: string } | null;
  currentVersion?: {
    cvVersionId?: string;
    sourceType?: string;
    versionNumber?: number;
  };
};

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
      const { data } = await api.get<
        Array<{
          templateId: string;
          templateName: string;
          description?: string | null;
        }>
      >("/cvs/templates");
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

  const duplicate = useMutation({
    mutationFn: (cvId: string) => api.post(`/cvs/me/${cvId}/duplicate`),
    onSuccess: () => {
      toast.success("Đã nhân bản CV");
      void qc.invalidateQueries({ queryKey: ["cvs", "me"] });
    },
    onError: (err: unknown) => {
      const msg =
        err &&
        typeof err === "object" &&
        "response" in err &&
        (err as { response?: { data?: { message?: string } } }).response?.data
          ?.message;
      toast.error(typeof msg === "string" ? msg : "Không nhân bản được");
    },
  });

  const remove = useMutation({
    mutationFn: (cvId: string) => api.delete(`/cvs/me/${cvId}`),
    onSuccess: () => {
      toast.success("Đã xóa CV");
      void qc.invalidateQueries({ queryKey: ["cvs", "me"] });
    },
    onError: (err: unknown) => {
      const msg =
        err &&
        typeof err === "object" &&
        "response" in err &&
        (err as { response?: { data?: { message?: string } } }).response?.data
          ?.message;
      toast.error(typeof msg === "string" ? msg : "Không xóa được");
    },
  });

  const editHref = (cvId: string) => {
    const q = new URLSearchParams();
    if (jobId) q.set("jobId", jobId);
    if (jobTitle) q.set("jobTitle", jobTitle);
    const qs = q.toString();
    return `/sinh-vien/cv/${cvId}${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="space-y-6">
      {jobId && (
        <p className="rounded-lg border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-950">
          Bạn đang chọn CV để phân tích / ứng tuyển tin{" "}
          <strong>{jobTitle ?? jobId}</strong>. Bấm <strong>Chỉnh sửa</strong>{" "}
          trên CV cần dùng.
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-slate-600">
          {cvs?.length ?? 0} CV · tạo nhiều bản, chỉnh sửa, xóa khi chưa ứng
          tuyển.
        </p>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
        >
          <Plus className="h-4 w-4" />
          Tạo CV mới
        </button>
      </div>

      {createOpen && (
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <h2 className="font-semibold text-slate-900">CV mới</h2>
          <label className="mt-3 block text-sm text-slate-700">Tên CV</label>
          <input
            className="mt-1 w-full max-w-md rounded-lg border px-3 py-2"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          {templates && templates.length > 0 && (
            <>
              <label className="mt-3 block text-sm text-slate-700">
                Mẫu (tùy chọn)
              </label>
              <select
                className="mt-1 w-full max-w-md rounded-lg border px-3 py-2"
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
              >
                <option value="">— Mặc định —</option>
                {templates.map((t) => (
                  <option key={t.templateId} value={t.templateId}>
                    {t.templateName}
                    {t.description ? ` — ${t.description}` : ""}
                  </option>
                ))}
              </select>
            </>
          )}
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              disabled={createCv.isPending}
              onClick={() => createCv.mutate()}
              className="rounded-lg bg-blue-700 px-4 py-2 text-white disabled:opacity-60"
            >
              {createCv.isPending && (
                <Loader2 className="mr-1 inline h-4 w-4 animate-spin" />
              )}
              Tạo &amp; chỉnh sửa
            </button>
            <button
              type="button"
              className="rounded-lg border px-4 py-2"
              onClick={() => setCreateOpen(false)}
            >
              Hủy
            </button>
          </div>
        </div>
      )}

      {isLoading && (
        <p className="text-slate-600">
          <Loader2 className="inline h-4 w-4 animate-spin" /> Đang tải…
        </p>
      )}

      {!isLoading && cvs?.length === 0 && (
        <div className="rounded-xl border border-dashed bg-white p-10 text-center">
          <FileText className="mx-auto h-10 w-10 text-slate-400" />
          <p className="mt-3 text-slate-700">Chưa có CV nào.</p>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="mt-4 text-blue-700 hover:underline"
          >
            Tạo CV đầu tiên
          </button>
        </div>
      )}

      <ul className="divide-y rounded-xl border bg-white">
        {cvs?.map((cv) => (
          <li
            key={cv.cvId}
            className="flex flex-wrap items-center justify-between gap-3 px-4 py-4"
          >
            <div>
              <p className="font-medium text-slate-900">{cv.cvName}</p>
              <p className="text-xs text-slate-500">
                {cv.template?.templateName
                  ? `Mẫu ${cv.template.templateName} · `
                  : ""}
                {cv.currentVersion?.sourceType === "UPLOAD"
                  ? "PDF upload"
                  : "Builder"}{" "}
                · v{cv.currentVersion?.versionNumber ?? 1}
                {cv.currentVersion?.cvVersionId && (
                  <> · ID phiên bản {cv.currentVersion.cvVersionId}</>
                )}
                {" · "}
                Cập nhật{" "}
                {new Date(cv.updatedAt).toLocaleDateString("vi-VN")}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={editHref(cv.cvId)}
                className="inline-flex items-center gap-1 rounded-lg border border-blue-700 px-3 py-1.5 text-sm text-blue-700 hover:bg-blue-50"
              >
                <Pencil className="h-3.5 w-3.5" />
                Chỉnh sửa
              </Link>
              {cv.currentVersion?.sourceType !== "UPLOAD" && (
                <button
                  type="button"
                  disabled={duplicate.isPending}
                  onClick={() => duplicate.mutate(cv.cvId)}
                  className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <Copy className="h-3.5 w-3.5" />
                  Nhân bản
                </button>
              )}
              <button
                type="button"
                disabled={remove.isPending}
                onClick={() => {
                  if (
                    window.confirm(
                      `Xóa "${cv.cvName}"? Không xóa được nếu đã ứng tuyển.`,
                    )
                  ) {
                    remove.mutate(cv.cvId);
                  }
                }}
                className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Xóa
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
