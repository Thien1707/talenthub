"use client";

import { Check } from "lucide-react";
import { resolveCvLayout, type CvLayoutKey } from "@/lib/cv/types";

export type CvTemplateItem = {
  templateId: string;
  templateName: string;
  description?: string | null;
  templateConfig?: unknown;
};

const layoutBadge: Record<CvLayoutKey, string> = {
  modern: "2 cột",
  topcv: "TopCV",
  classic: "Cổ điển",
};

function TemplateThumb({
  layout,
  accent,
}: {
  layout: CvLayoutKey;
  accent?: string;
}) {
  if (layout === "topcv") {
    return (
      <div className="flex h-full flex-col gap-1 p-2">
        <div className="h-2 w-2/3 rounded bg-slate-300" />
        <div className="h-1 w-full rounded bg-slate-200" />
        <div className="mt-1 h-1 w-full rounded bg-slate-200" />
        <div className="mt-auto h-1 w-4/5 rounded bg-slate-200" />
      </div>
    );
  }
  return (
    <div className="flex h-full gap-1 p-2">
      <div
        className="w-[32%] rounded-sm"
        style={{ backgroundColor: accent ?? "#334155" }}
      />
      <div className="flex flex-1 flex-col gap-1">
        <div className="h-1.5 w-full rounded bg-slate-200" />
        <div className="h-1 w-4/5 rounded bg-slate-200" />
        <div className="h-1 w-full rounded bg-slate-200" />
      </div>
    </div>
  );
}

function accentFromConfig(raw: unknown): string | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const c = raw as { accentColor?: string; primaryColor?: string };
  return c.accentColor ?? c.primaryColor;
}

export function CvTemplateGallery({
  templates,
  selectedId,
  onSelect,
  disabled,
  compact,
}: {
  templates: CvTemplateItem[];
  selectedId?: string;
  onSelect: (templateId: string) => void;
  disabled?: boolean;
  compact?: boolean;
}) {
  if (!templates.length) {
    return (
      <p className="text-sm text-slate-500">Chưa có mẫu — chạy seed trên API.</p>
    );
  }

  return (
    <div
      className={
        compact
          ? "grid grid-cols-1 gap-2 sm:grid-cols-2"
          : "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
      }
    >
      {templates.map((t) => {
        const layout = resolveCvLayout(t.templateConfig);
        const selected = selectedId === t.templateId;
        return (
          <button
            key={t.templateId}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(t.templateId)}
            className={`group relative overflow-hidden rounded-xl border-2 text-left transition ${
              selected
                ? "border-blue-600 bg-blue-50/50 ring-2 ring-blue-100"
                : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
            } disabled:opacity-60`}
          >
            <div
              className={`border-b border-slate-100 bg-slate-50 ${compact ? "h-16" : "h-24"}`}
            >
              <TemplateThumb
                layout={layout}
                accent={accentFromConfig(t.templateConfig)}
              />
            </div>
            <div className="p-3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-slate-900">
                  {t.templateName}
                </p>
                {selected && (
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
                    <Check className="h-3 w-3" />
                  </span>
                )}
              </div>
              <span className="mt-1 inline-block rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                {layoutBadge[layout]}
              </span>
              {t.description && (
                <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                  {t.description}
                </p>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
