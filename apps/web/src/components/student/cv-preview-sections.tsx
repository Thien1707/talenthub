"use client";

import type { ReactNode } from "react";
import type { CvContent } from "@/lib/cv/types";
import type { CvSectionKey } from "@/lib/cv/section-order";
import { resolveSectionOrder } from "@/lib/cv/section-order";

function BulletText({ text }: { text: string }) {
  const lines = text.split("\n").filter((l) => l.trim());
  if (lines.length <= 1) return <p className="text-[10px] text-slate-600">{text}</p>;
  return (
    <ul className="mt-0.5 list-disc pl-4 text-[10px] text-slate-600">
      {lines.map((l, i) => (
        <li key={i}>{l.replace(/^[-•]\s*/, "")}</li>
      ))}
    </ul>
  );
}

function ModernSection({
  title,
  accent,
  children,
}: {
  title: string;
  accent: string;
  children: ReactNode;
}) {
  return (
    <section className="mb-5">
      <h3
        className="border-b-2 pb-1 text-[10px] font-bold uppercase tracking-wider"
        style={{ borderColor: accent, color: accent }}
      >
        {title}
      </h3>
      <div className="mt-2">{children}</div>
    </section>
  );
}

function TopcvSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="mb-4">
      <h3 className="text-[10px] font-bold uppercase tracking-wide text-slate-900">
        {title}
      </h3>
      <div className="mt-1 h-0.5 w-full bg-[#00b14f]" />
      <div className="mt-2">{children}</div>
    </section>
  );
}

function modernBlock(
  key: CvSectionKey,
  content: CvContent,
  accent: string,
): ReactNode | null {
  switch (key) {
    case "skills":
      return null;
    case "experience":
      if (!content.experience.length) return null;
      return (
        <ModernSection key={key} title="Kinh nghiệm" accent={accent}>
          <ul className="space-y-3">
            {content.experience.map((ex, i) => (
              <li key={i}>
                <p className="font-semibold text-slate-900">
                  {ex.title || "Vị trí"}
                  {ex.company ? ` · ${ex.company}` : ""}
                </p>
                {(ex.from || ex.to) && (
                  <p className="text-[9px] text-slate-500">
                    {[ex.from, ex.to].filter(Boolean).join(" – ")}
                  </p>
                )}
                {ex.description && (
                  <p className="mt-1 whitespace-pre-wrap text-[10px] text-slate-600">
                    {ex.description}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </ModernSection>
      );
    case "education":
      if (!content.education.length) return null;
      return (
        <ModernSection key={key} title="Học vấn" accent={accent}>
          <ul className="space-y-2">
            {content.education.map((ed, i) => (
              <li key={i}>
                <p className="font-semibold text-slate-900">{ed.school || "Trường"}</p>
                <p className="text-[10px] text-slate-600">{ed.major}</p>
                {(ed.from || ed.to) && (
                  <p className="text-[9px] text-slate-500">
                    {[ed.from, ed.to].filter(Boolean).join(" – ")}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </ModernSection>
      );
    case "projects":
      if (!content.projects.length) return null;
      return (
        <ModernSection key={key} title="Dự án" accent={accent}>
          <ul className="space-y-2">
            {content.projects.map((p, i) => (
              <li key={i}>
                <p className="font-semibold text-slate-900">{p.name}</p>
                {p.description && (
                  <p className="text-[10px] text-slate-600">{p.description}</p>
                )}
                {p.link && (
                  <p className="truncate text-[9px] text-sky-700">{p.link}</p>
                )}
              </li>
            ))}
          </ul>
        </ModernSection>
      );
    case "activities": {
      const activities = content.activities ?? [];
      if (!activities.length) return null;
      return (
        <ModernSection key={key} title="Hoạt động" accent={accent}>
          <ul className="space-y-2">
            {activities.map((act, i) => (
              <li key={i}>
                <p className="font-semibold text-slate-900">
                  {act.organization || "Tổ chức"}
                  {act.role ? ` · ${act.role}` : ""}
                </p>
                {(act.from || act.to) && (
                  <p className="text-[9px] text-slate-500">
                    {[act.from, act.to].filter(Boolean).join(" – ")}
                  </p>
                )}
                {act.description && (
                  <p className="text-[10px] text-slate-600">{act.description}</p>
                )}
              </li>
            ))}
          </ul>
        </ModernSection>
      );
    }
    case "certificates": {
      const certificates = content.certificates ?? [];
      const awards = content.awards ?? [];
      if (!certificates.length && !awards.length) return null;
      return (
        <ModernSection key={key} title="Chứng chỉ & giải thưởng" accent={accent}>
          <ul className="space-y-1 text-[10px] text-slate-700">
            {certificates.map((c, i) => (
              <li key={`c-${i}`}>
                {c.name || "Chứng chỉ"}
                {c.year ? ` (${c.year})` : ""}
              </li>
            ))}
            {awards.map((a, i) => (
              <li key={`a-${i}`}>
                {a.name || "Danh hiệu"}
                {a.year ? ` (${a.year})` : ""}
              </li>
            ))}
          </ul>
        </ModernSection>
      );
    }
    default:
      return null;
  }
}

function topcvBlock(key: CvSectionKey, content: CvContent): ReactNode | null {
  const activities = content.activities ?? [];
  const certificates = content.certificates ?? [];
  const awards = content.awards ?? [];
  const skillsCol1 = content.skills.filter((_, i) => i % 2 === 0);
  const skillsCol2 = content.skills.filter((_, i) => i % 2 === 1);

  switch (key) {
    case "education":
      if (!content.education.length) return null;
      return (
        <TopcvSection key={key} title="Học vấn">
          <ul className="space-y-2">
            {content.education.map((ed, i) => (
              <li key={i}>
                <div className="flex justify-between gap-2 text-[10px]">
                  <span className="font-semibold text-slate-900">
                    {ed.school || "Trường"}
                  </span>
                  <span className="shrink-0 text-slate-500">
                    {[ed.from, ed.to].filter(Boolean).join(" - ")}
                  </span>
                </div>
                {ed.major && (
                  <p className="text-[10px] font-medium text-slate-800">{ed.major}</p>
                )}
                {ed.description && (
                  <p className="text-[10px] text-slate-600">{ed.description}</p>
                )}
              </li>
            ))}
          </ul>
        </TopcvSection>
      );
    case "experience":
      if (!content.experience.length) return null;
      return (
        <TopcvSection key={key} title="Kinh nghiệm làm việc">
          <ul className="space-y-3">
            {content.experience.map((ex, i) => (
              <li key={i}>
                <div className="flex justify-between gap-2 text-[10px]">
                  <span className="font-semibold text-slate-900">
                    {ex.company || "Công ty"}
                  </span>
                  <span className="shrink-0 text-slate-500">
                    {[ex.from, ex.to].filter(Boolean).join(" - ")}
                  </span>
                </div>
                {ex.title && (
                  <p className="text-[10px] font-medium text-slate-800">{ex.title}</p>
                )}
                {ex.description && <BulletText text={ex.description} />}
              </li>
            ))}
          </ul>
        </TopcvSection>
      );
    case "skills":
      if (!content.skills.length) return null;
      return (
        <TopcvSection key={key} title="Kỹ năng">
          <div className="grid grid-cols-2 gap-x-4 text-[10px] text-slate-700">
            <ul className="space-y-0.5">
              {skillsCol1.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
            <ul className="space-y-0.5">
              {skillsCol2.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
        </TopcvSection>
      );
    case "activities":
      if (!activities.length) return null;
      return (
        <TopcvSection key={key} title="Hoạt động">
          <ul className="space-y-2">
            {activities.map((act, i) => (
              <li key={i}>
                <div className="flex justify-between gap-2 text-[10px]">
                  <span className="font-semibold">{act.organization || "Tổ chức"}</span>
                  <span className="shrink-0 text-slate-500">
                    {[act.from, act.to].filter(Boolean).join(" - ")}
                  </span>
                </div>
                {act.role && <p className="text-[10px] font-medium">{act.role}</p>}
                {act.description && <BulletText text={act.description} />}
              </li>
            ))}
          </ul>
        </TopcvSection>
      );
    case "certificates":
      if (!certificates.length && !awards.length) return null;
      return (
        <>
          {certificates.length > 0 && (
            <TopcvSection key={`${key}-cert`} title="Chứng chỉ">
              <ul className="space-y-1">
                {certificates.map((c, i) => (
                  <li key={i} className="flex justify-between text-[10px]">
                    <span>{c.name || "Chứng chỉ"}</span>
                    <span className="text-slate-500">{c.year}</span>
                  </li>
                ))}
              </ul>
            </TopcvSection>
          )}
          {awards.length > 0 && (
            <TopcvSection key={`${key}-award`} title="Danh hiệu và giải thưởng">
              <ul className="space-y-1">
                {awards.map((a, i) => (
                  <li key={i} className="flex justify-between text-[10px]">
                    <span>{a.name || "Danh hiệu"}</span>
                    <span className="text-slate-500">{a.year}</span>
                  </li>
                ))}
              </ul>
            </TopcvSection>
          )}
        </>
      );
    case "projects":
      if (!content.projects.length) return null;
      return (
        <TopcvSection key={key} title="Dự án">
          <ul className="space-y-2">
            {content.projects.map((p, i) => (
              <li key={i}>
                <p className="font-semibold text-slate-900">{p.name}</p>
                {p.description && (
                  <p className="text-[10px] text-slate-600">{p.description}</p>
                )}
              </li>
            ))}
          </ul>
        </TopcvSection>
      );
    default:
      return null;
  }
}

export function CvModernMainSections({
  content,
  accent,
}: {
  content: CvContent;
  accent: string;
}) {
  const order = resolveSectionOrder(content);
  return (
    <>
      {order.map((key) => modernBlock(key, content, accent))}
    </>
  );
}

export function CvTopcvOrderedSections({ content }: { content: CvContent }) {
  const order = resolveSectionOrder(content);
  return (
    <>
      {order.map((key) => topcvBlock(key, content))}
    </>
  );
}
