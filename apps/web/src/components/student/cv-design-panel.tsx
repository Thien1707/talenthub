"use client";

import { CvSectionOrderList } from "@/components/student/cv-section-order-list";
import {
  CvTemplateGallery,
  type CvTemplateItem,
} from "@/components/student/cv-template-gallery";
import type { CvSectionKey } from "@/lib/cv/section-order";
import type { CvLayoutKey } from "@/lib/cv/types";

const layoutLabels: Record<CvLayoutKey, string> = {
  modern: "Hiện đại — 2 cột (sidebar màu)",
  topcv: "TopCV — 1 cột truyền thống",
  classic: "Cổ điển (preview dùng layout hiện đại)",
};

const ACCENT_PRESETS = [
  { name: "Navy", value: "#1e3a5f" },
  { name: "Teal", value: "#0f766e" },
  { name: "Indigo", value: "#3730a3" },
  { name: "Burgundy", value: "#7f1d1d" },
  { name: "Slate", value: "#334155" },
];

export function CvDesignPanel({
  layout,
  templateName,
  templates,
  selectedTemplateId,
  onTemplateSelect,
  templateChangePending,
  accentColor,
  onAccentChange,
  sectionOrder,
  onSectionOrderChange,
  previewScale,
  onPreviewScaleChange,
}: {
  layout: CvLayoutKey;
  templateName?: string;
  templates?: CvTemplateItem[];
  selectedTemplateId?: string;
  onTemplateSelect?: (templateId: string) => void;
  templateChangePending?: boolean;
  accentColor: string;
  onAccentChange: (hex: string) => void;
  sectionOrder: CvSectionKey[];
  onSectionOrderChange: (order: CvSectionKey[]) => void;
  previewScale: number;
  onPreviewScaleChange: (n: number) => void;
}) {
  return (
    <div className="space-y-6 p-1">
      <div>
        <h3 className="text-sm font-semibold text-slate-900">Thư viện mẫu</h3>
        <p className="mt-1 text-xs text-slate-500">
          {templateName ? (
            <>
              Đang dùng <strong>{templateName}</strong> — {layoutLabels[layout]}
            </>
          ) : (
            layoutLabels[layout]
          )}
        </p>
        {templates && onTemplateSelect && (
          <div className="mt-3">
            <CvTemplateGallery
              templates={templates}
              selectedId={selectedTemplateId}
              onSelect={onTemplateSelect}
              disabled={templateChangePending}
              compact
            />
          </div>
        )}
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-900">Thứ tự mục</h3>
        <p className="mt-1 text-xs text-slate-500">
          Kéo thả để sắp xếp — áp dụng cho tab Nội dung và xem trước. Nhớ bấm Lưu.
        </p>
        <div className="mt-3">
          <CvSectionOrderList
            order={sectionOrder}
            onOrderChange={onSectionOrderChange}
            layoutHint={layout}
          />
        </div>
      </div>

      {layout !== "topcv" && (
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Màu sidebar</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {ACCENT_PRESETS.map((p) => (
              <button
                key={p.value}
                type="button"
                title={p.name}
                onClick={() => onAccentChange(p.value)}
                className={`h-9 w-9 rounded-full border-2 shadow-sm transition ${
                  accentColor === p.value
                    ? "border-blue-600 ring-2 ring-blue-200"
                    : "border-white"
                }`}
                style={{ backgroundColor: p.value }}
              />
            ))}
          </div>
          <label className="mt-3 block text-xs text-slate-600">Mã màu tùy chọn</label>
          <input
            type="color"
            value={accentColor}
            onChange={(e) => onAccentChange(e.target.value)}
            className="mt-1 h-10 w-full cursor-pointer rounded border bg-white"
          />
        </div>
      )}

      <div>
        <h3 className="text-sm font-semibold text-slate-900">Thu phóng xem trước</h3>
        <input
          type="range"
          min={80}
          max={110}
          value={previewScale}
          onChange={(e) => onPreviewScaleChange(Number(e.target.value))}
          className="mt-2 w-full"
        />
        <p className="text-xs text-slate-500">
          {previewScale}% — kéo để xem trang A4 vừa màn hình.
        </p>
      </div>
    </div>
  );
}
