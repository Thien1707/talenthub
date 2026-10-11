"use client";

import type { CvContent } from "@/lib/cv/types";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
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

function RowHeader({ left, right }: { left: string; right?: string }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <p className="font-semibold text-slate-900">{left}</p>
      {right && (
        <p className="shrink-0 text-[9px] text-slate-500">{right}</p>
      )}
    </div>
  );
}

function BulletText({ text }: { text: string }) {
  const lines = text
    .split(/\n/)
    .map((l) => l.replace(/^[\s•\-–]+/, "").trim())
    .filter(Boolean);
  if (!lines.length) return null;
  return (
    <ul className="mt-1 list-none space-y-0.5 pl-1 text-[10px] text-slate-700">
      {lines.map((line, i) => (
        <li key={i} className="before:mr-1 before:content-['•']">
          {line}
        </li>
      ))}
    </ul>
  );
}

export function CvTopCvPreview({
  content,
  cvName,
}: {
  content: CvContent;
  cvName: string;
}) {
  const name = content.personal.fullName?.trim() || cvName;
  const headline = content.personal.headline?.trim();
  const contact = [
    content.personal.phone,
    content.personal.email,
    content.personal.website,
    content.personal.city,
  ].filter(Boolean);

  const activities = content.activities ?? [];
  const certificates = content.certificates ?? [];
  const awards = content.awards ?? [];
  const mid = Math.ceil(content.skills.length / 2);
  const skillsCol1 = content.skills.slice(0, mid);
  const skillsCol2 = content.skills.slice(mid);

  return (
    <div className="mx-auto aspect-[210/297] w-full max-w-[520px] overflow-hidden rounded-lg border border-slate-200 bg-white p-6 shadow-lg">
      <div className="text-[11px] leading-snug text-slate-800">
        <h2 className="text-lg font-bold text-slate-900">{name}</h2>
        {headline && (
          <p className="mt-0.5 text-[11px] font-medium text-slate-600">
            {headline}
          </p>
        )}
        {contact.length > 0 && (
          <p className="mt-2 text-[9px] text-slate-500">
            {contact.join("   ·   ")}
          </p>
        )}

        {content.personal.summary?.trim() && (
          <Section title="Mục tiêu nghề nghiệp">
            <p className="whitespace-pre-wrap text-[10px] text-justify text-slate-700">
              {content.personal.summary}
            </p>
          </Section>
        )}

        {content.education.length > 0 && (
          <Section title="Học vấn">
            <ul className="space-y-2">
              {content.education.map((ed, i) => (
                <li key={i}>
                  <RowHeader
                    left={ed.school || "Trường"}
                    right={[ed.from, ed.to].filter(Boolean).join(" - ")}
                  />
                  {ed.major && (
                    <p className="text-[10px] font-medium text-slate-800">
                      {ed.major}
                    </p>
                  )}
                  {ed.description && (
                    <p className="text-[10px] text-slate-600">{ed.description}</p>
                  )}
                </li>
              ))}
            </ul>
          </Section>
        )}

        {content.experience.length > 0 && (
          <Section title="Kinh nghiệm làm việc">
            <ul className="space-y-3">
              {content.experience.map((ex, i) => (
                <li key={i}>
                  <RowHeader
                    left={ex.company || "Công ty"}
                    right={[ex.from, ex.to].filter(Boolean).join(" - ")}
                  />
                  {ex.title && (
                    <p className="text-[10px] font-medium text-slate-800">
                      {ex.title}
                    </p>
                  )}
                  {ex.description && <BulletText text={ex.description} />}
                </li>
              ))}
            </ul>
          </Section>
        )}

        {content.skills.length > 0 && (
          <Section title="Kỹ năng">
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
          </Section>
        )}

        {activities.length > 0 && (
          <Section title="Hoạt động">
            <ul className="space-y-2">
              {activities.map((act, i) => (
                <li key={i}>
                  <RowHeader
                    left={act.organization || "Tổ chức"}
                    right={[act.from, act.to].filter(Boolean).join(" - ")}
                  />
                  {act.role && (
                    <p className="text-[10px] font-medium">{act.role}</p>
                  )}
                  {act.description && <BulletText text={act.description} />}
                </li>
              ))}
            </ul>
          </Section>
        )}

        {certificates.length > 0 && (
          <Section title="Chứng chỉ">
            <ul className="space-y-1">
              {certificates.map((c, i) => (
                <li key={i}>
                  <RowHeader left={c.name || "Chứng chỉ"} right={c.year} />
                </li>
              ))}
            </ul>
          </Section>
        )}

        {awards.length > 0 && (
          <Section title="Danh hiệu và giải thưởng">
            <ul className="space-y-1">
              {awards.map((a, i) => (
                <li key={i}>
                  <RowHeader left={a.name || "Danh hiệu"} right={a.year} />
                </li>
              ))}
            </ul>
          </Section>
        )}

        {content.personal.references?.trim() && (
          <Section title="Người giới thiệu">
            <p className="text-[10px] text-slate-700">
              {content.personal.references}
            </p>
          </Section>
        )}

        {content.personal.interests?.trim() && (
          <Section title="Sở thích">
            <p className="text-[10px] text-slate-700">
              {content.personal.interests}
            </p>
          </Section>
        )}

        {content.personal.extraNotes?.trim() && (
          <Section title="Thông tin thêm">
            <p className="text-[10px] text-slate-700">
              {content.personal.extraNotes}
            </p>
          </Section>
        )}

        {content.projects.length > 0 && (
          <Section title="Dự án">
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
          </Section>
        )}
      </div>
    </div>
  );
}
