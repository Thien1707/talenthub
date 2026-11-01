"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { api } from "@/lib/api/client";
import { normalizeCvContentJson } from "@/lib/cv/normalize-content";
import { resolveCvLayout, type CvContent } from "@/lib/cv/types";
import { templateAccentColor } from "@/lib/cv/template-config";
import { CvPreview } from "@/components/student/cv-preview";
import { CvUploadPreview } from "@/components/student/cv-upload-preview";

type CvDetail = {
  cvId: string;
  cvName: string;
  template?: { templateConfig?: unknown } | null;
  currentVersion?: {
    sourceType?: string;
    contentJson?: unknown;
    plainTextContent?: string | null;
    fileAsset?: {
      assetId?: string;
      mimeType?: string | null;
      originalFilename?: string | null;
    };
  };
};

export function CvViewPage({
  cvId,
  jobId,
  jobTitle,
}: {
  cvId: string;
  jobId?: string;
  jobTitle?: string;
}) {
  const { data: cv, isLoading, isError } = useQuery({
    queryKey: ["cvs", cvId],
    queryFn: async () => {
      const { data } = await api.get<CvDetail>(`/cvs/me/${cvId}`);
      return data;
    },
  });

  const aiHref = (() => {
    const q = new URLSearchParams();
    if (jobId) q.set("jobId", jobId);
    if (jobTitle) q.set("jobTitle", jobTitle);
    const qs = q.toString();
    return `/sinh-vien/cv/${cvId}${qs ? `?${qs}` : ""}`;
  })();

  if (isLoading) {
    return (
      <p className="flex items-center gap-2 text-slate-600">
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
        Đang tải CV…
      </p>
    );
  }

  if (isError || !cv) {
    return (
      <p className="text-red-700">
        Không tìm thấy CV.{" "}
        <Link href="/sinh-vien/cv" className="font-bold underline">
          Quay lại danh sách
        </Link>
      </p>
    );
  }

  const isUpload = cv.currentVersion?.sourceType === "UPLOAD";
  const content = normalizeCvContentJson(
    cv.currentVersion?.contentJson,
  ) as CvContent;
  const layout = resolveCvLayout(cv.template?.templateConfig);
  const accent = templateAccentColor(cv.template?.templateConfig);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{cv.cvName}</h1>
          <p className="text-sm text-slate-600">
            {isUpload ? "Xem CV tải lên" : "Xem CV TalentHub"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/sinh-vien/cv" className="button button-secondary">
            ← Danh sách CV
          </Link>
          <Link href={aiHref} className="button">
            Phân tích AI
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        {isUpload ? (
          <CvUploadPreview
            assetId={cv.currentVersion?.fileAsset?.assetId}
            mimeType={cv.currentVersion?.fileAsset?.mimeType}
            fileName={
              cv.currentVersion?.fileAsset?.originalFilename ?? cv.cvName
            }
            plainTextPreview={cv.currentVersion?.plainTextContent}
          />
        ) : (
          <div className="flex justify-center overflow-x-auto py-4">
            <CvPreview
              layout={layout}
              content={content}
              cvName={cv.cvName}
              accentColor={accent}
              scale={100}
              showLabel
              editable={false}
            />
          </div>
        )}
      </div>
    </div>
  );
}
