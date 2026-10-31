"use client";

import { CvModernPreview } from "@/components/student/cv-modern-preview";
import { CvTopCvPreview } from "@/components/student/cv-topcv-preview";
import type { PersonalKey } from "@/lib/cv/edit-personal";
import type { CvContent, CvLayoutKey } from "@/lib/cv/types";

const layoutLabels: Record<CvLayoutKey, string> = {
  modern: "Hiện đại (2 cột)",
  topcv: "TopCV (1 cột)",
  classic: "Cổ điển",
};

/** Chiều rộng trang A4 trên màn hình (px) — khớp tỉ lệ export. */
export const CV_PREVIEW_PAGE_WIDTH_PX = 520;

export function CvPreview({
  layout,
  content,
  cvName,
  accentColor,
  scale = 100,
  showLabel = true,
  editable,
  onEditPersonal,
}: {
  layout: CvLayoutKey;
  content: CvContent;
  cvName: string;
  accentColor?: string;
  scale?: number;
  showLabel?: boolean;
  editable?: boolean;
  onEditPersonal?: (key: PersonalKey, value: string) => void;
}) {
  const preview =
    layout === "topcv" ? (
      <CvTopCvPreview
        content={content}
        cvName={cvName}
        editable={editable}
        onEditPersonal={onEditPersonal}
      />
    ) : (
      <CvModernPreview
        content={content}
        cvName={cvName}
        accentColor={accentColor ?? content.design?.accentColor}
        editable={editable}
        onEditPersonal={onEditPersonal}
      />
    );

  const pageWidth = Math.round((CV_PREVIEW_PAGE_WIDTH_PX * scale) / 100);

  return (
    <div
      className="mx-auto shrink-0 transition-[width] duration-150"
      style={{ width: pageWidth, maxWidth: "100%" }}
    >
      {showLabel && (
        <p className="mb-2 text-center text-xs font-medium text-slate-600">
          {editable
            ? "Bấm vào chữ trên CV để sửa · nhớ Lưu"
            : `Xem trước A4 · ${layoutLabels[layout] ?? layoutLabels.modern}`}
        </p>
      )}
      <div className="w-full">{preview}</div>
    </div>
  );
}
