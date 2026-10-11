"use client";

import { CvModernPreview } from "@/components/student/cv-modern-preview";
import { CvTopCvPreview } from "@/components/student/cv-topcv-preview";
import type { CvContent, CvLayoutKey } from "@/lib/cv/types";

const layoutLabels: Record<CvLayoutKey, string> = {
  modern: "Hiện đại (2 cột)",
  topcv: "TopCV (1 cột)",
  classic: "Cổ điển",
};

export function CvPreview({
  layout,
  content,
  cvName,
}: {
  layout: CvLayoutKey;
  content: CvContent;
  cvName: string;
}) {
  const preview =
    layout === "topcv" ? (
      <CvTopCvPreview content={content} cvName={cvName} />
    ) : (
      <CvModernPreview content={content} cvName={cvName} />
    );

  return (
    <div>
      <p className="mb-2 text-sm font-medium text-slate-700">
        Xem trước · {layoutLabels[layout] ?? layoutLabels.modern}
      </p>
      {preview}
    </div>
  );
}
