"use client";

import { CvEditableField } from "@/components/student/cv-editable-field";
import { CvModernMainSections } from "@/components/student/cv-preview-sections";
import type { PersonalKey } from "@/lib/cv/edit-personal";
import type { CvContent } from "@/lib/cv/types";

const DEFAULT_ACCENT = "#1e3a5f";

export function CvModernPreview({
  content,
  cvName,
  accentColor,
  editable,
  onEditPersonal,
}: {
  content: CvContent;
  cvName: string;
  accentColor?: string;
  editable?: boolean;
  onEditPersonal?: (key: PersonalKey, value: string) => void;
}) {
  const name = content.personal.fullName?.trim() || cvName;
  const headline = content.personal.headline?.trim() || "Sinh viên / Ứng viên";
  const accent = accentColor ?? content.design?.accentColor ?? DEFAULT_ACCENT;
  const commit = (key: PersonalKey, value: string) => onEditPersonal?.(key, value);

  const textField = (
    key: PersonalKey,
    display: string,
    placeholder: string,
    className: string,
    multiline?: boolean,
    block?: boolean,
  ) =>
    editable && onEditPersonal ? (
      <CvEditableField
        block={block}
        multiline={multiline}
        value={content.personal[key] ?? ""}
        placeholder={placeholder || display}
        className={className}
        onCommit={(v) => commit(key, v)}
      />
    ) : (
      <>{display}</>
    );

  return (
    <div className="aspect-[210/297] w-full overflow-hidden rounded-sm border border-slate-300/80 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.18)]">
      <div className="flex h-full min-h-[640px] text-[11px] leading-snug text-slate-800">
        <aside
          className="flex w-[34%] shrink-0 flex-col px-4 py-6 text-white"
          style={{ backgroundColor: accent }}
        >
          <div
            className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full border-2 border-white/40 text-2xl font-light text-white"
            style={{ backgroundColor: `${accent}cc` }}
          >
            {name.charAt(0).toUpperCase() || "?"}
          </div>
          <h2 className="text-center text-sm font-bold uppercase tracking-wide">
            {textField(
              "fullName",
              name,
              "Họ và tên",
              "min-w-[4rem] text-center",
              false,
              true,
            )}
          </h2>
          <p className="mt-1 text-center text-[10px] font-medium text-sky-200">
            {textField(
              "headline",
              headline,
              "Vị trí / headline",
              "min-w-[4rem] text-center",
              false,
              true,
            )}
          </p>
          <div className="mt-6 space-y-2 border-t border-white/20 pt-4 text-[10px]">
            <p className="text-[9px] font-semibold uppercase tracking-widest text-sky-200">
              Liên hệ
            </p>
            {(editable || content.personal.email) && (
              <p>
                {textField("email", content.personal.email ?? "", "Email", "min-w-[3rem]", false, true)}
              </p>
            )}
            {(editable || content.personal.phone) && (
              <p>
                {textField("phone", content.personal.phone ?? "", "SĐT", "min-w-[3rem]", false, true)}
              </p>
            )}
            {(editable || content.personal.city) && (
              <p>
                {textField("city", content.personal.city ?? "", "Thành phố", "min-w-[3rem]", false, true)}
              </p>
            )}
          </div>
          {content.skills.length > 0 && (
            <div className="mt-5 space-y-2 border-t border-white/20 pt-4">
              <p className="text-[9px] font-semibold uppercase tracking-widest text-sky-200">
                Kỹ năng
              </p>
              <ul className="flex flex-wrap gap-1">
                {content.skills.map((s) => (
                  <li
                    key={s}
                    className="rounded bg-white/15 px-1.5 py-0.5 text-[9px]"
                  >
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
        <main className="flex-1 px-5 py-6">
          {(editable || content.personal.summary?.trim()) && (
            <section className="mb-5">
              <h3
                className="border-b-2 pb-1 text-[10px] font-bold uppercase tracking-wider"
                style={{ borderColor: accent, color: accent }}
              >
                Giới thiệu
              </h3>
              <p className="mt-2 whitespace-pre-wrap text-[10px] text-slate-700">
                {textField(
                  "summary",
                  content.personal.summary ?? "",
                  "Giới thiệu / mục tiêu nghề nghiệp…",
                  "min-h-[2rem] min-w-[4rem]",
                  true,
                  true,
                )}
              </p>
            </section>
          )}
          <CvModernMainSections content={content} accent={accent} />
        </main>
      </div>
    </div>
  );
}
