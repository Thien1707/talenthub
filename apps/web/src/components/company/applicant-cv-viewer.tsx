"use client";

import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { api, getStoredAccessToken } from "@/lib/api/client";
import { CvPreview } from "@/components/student/cv-preview";
import { resolveCvLayout, type CvContent } from "@/lib/cv/types";

type CvView = {
  cvName: string;
  templateConfig?: unknown;
  sourceType: string;
  contentJson?: CvContent | null;
  personal?: CvContent["personal"];
  plainTextContent?: string | null;
  coverLetter?: string | null;
  fileAsset?: { assetId: string; originalFilename?: string | null } | null;
};

export function ApplicantCvViewer({
  applicationId,
}: {
  applicationId: string;
}) {
  const [open, setOpen] = useState(false);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["applications", applicationId, "cv"],
    enabled: open,
    queryFn: async () => {
      const { data: res } = await api.get<CvView>(
        `/applications/${applicationId}/cv`,
      );
      return res;
    },
  });

  const openPdf = async () => {
    const assetId = data?.fileAsset?.assetId;
    if (!assetId) return;
    const { data: signed } = await api.get<{ signedUrl: string }>(
      `/media/${assetId}/signed-url`,
    );
    window.open(signed.signedUrl, "_blank", "noopener,noreferrer");
  };

  const downloadBuilderPdf = async () => {
    const base =
      process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";
    const token = getStoredAccessToken();
    const res = await fetch(
      `${base}/applications/${applicationId}/cv/export/pdf`,
      {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: "include",
      },
    );
    if (!res.ok) {
      toast.error("Không tải được PDF");
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ung-vien-${applicationId}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <button
        type="button"
        className="text-sm font-medium text-emerald-800 hover:underline"
        onClick={() => setOpen(true)}
      >
        Xem CV
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-5 shadow-lg">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-lg font-semibold text-slate-900">
                CV ứng viên
              </h3>
              <button
                type="button"
                className="text-sm text-slate-600 hover:underline"
                onClick={() => setOpen(false)}
              >
                Đóng
              </button>
            </div>
            {(isLoading || isFetching) && (
              <p className="mt-4 flex items-center gap-2 text-sm text-slate-600">
                <Loader2 className="h-4 w-4 animate-spin" /> Đang tải…
              </p>
            )}
            {data && (
              <div className="mt-4 space-y-4 text-sm text-slate-800">
                <p>
                  <span className="font-medium">{data.cvName}</span> ·{" "}
                  {data.sourceType === "UPLOAD" ? "PDF upload" : "Builder"}
                </p>
                {data.coverLetter && (
                  <div>
                    <p className="font-medium">Thư giới thiệu</p>
                    <p className="whitespace-pre-wrap text-slate-700">
                      {data.coverLetter}
                    </p>
                  </div>
                )}
                {data.sourceType === "UPLOAD" && data.fileAsset && (
                  <button
                    type="button"
                    onClick={() => void openPdf()}
                    className="rounded-lg bg-emerald-700 px-3 py-2 text-white hover:bg-emerald-800"
                  >
                    Mở PDF ({data.fileAsset.originalFilename ?? "file"})
                  </button>
                )}
                {data.sourceType === "BUILDER" && data.contentJson && (
                  <>
                    <button
                      type="button"
                      onClick={() => void downloadBuilderPdf()}
                      className="mb-4 rounded-lg border px-3 py-2 hover:bg-slate-50"
                    >
                      Tải PDF
                    </button>
                    <CvPreview
                      layout={resolveCvLayout(data.templateConfig)}
                      content={data.contentJson}
                      cvName={data.cvName}
                    />
                  </>
                )}
                {data.plainTextContent &&
                  data.sourceType === "UPLOAD" &&
                  !data.contentJson && (
                    <p className="line-clamp-6 text-slate-600">
                      {data.plainTextContent.slice(0, 1200)}
                    </p>
                  )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
