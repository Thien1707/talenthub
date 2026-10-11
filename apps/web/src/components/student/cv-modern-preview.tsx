"use client";

import type { CvContent } from "@/lib/cv/types";

export function CvModernPreview({
  content,
  cvName,
}: {
  content: CvContent;
  cvName: string;
}) {
  const name = content.personal.fullName?.trim() || cvName;
  const headline = content.personal.headline?.trim() || "Sinh viên / Ứng viên";

  return (
    <div className="mx-auto aspect-[210/297] w-full max-w-[520px] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
      <div className="flex h-full min-h-[640px] text-[11px] leading-snug text-slate-800">
        <aside className="flex w-[34%] shrink-0 flex-col bg-[#1e3a5f] px-4 py-6 text-white">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full border-2 border-sky-300/60 bg-[#16304d] text-2xl font-light text-sky-100">
            {name.charAt(0).toUpperCase() || "?"}
          </div>
          <h2 className="text-center text-sm font-bold uppercase tracking-wide">
            {name}
          </h2>
          <p className="mt-1 text-center text-[10px] font-medium text-sky-200">
            {headline}
          </p>
          <div className="mt-6 space-y-2 border-t border-white/20 pt-4 text-[10px]">
            <p className="text-[9px] font-semibold uppercase tracking-widest text-sky-200">
              Liên hệ
            </p>
            {content.personal.email && <p>{content.personal.email}</p>}
            {content.personal.phone && <p>{content.personal.phone}</p>}
            {content.personal.city && <p>{content.personal.city}</p>}
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
          {content.personal.summary && (
            <section className="mb-5">
              <h3 className="border-b-2 border-[#1e3a5f] pb-1 text-[10px] font-bold uppercase tracking-wider text-[#1e3a5f]">
                Giới thiệu
              </h3>
              <p className="mt-2 whitespace-pre-wrap text-[10px] text-slate-700">
                {content.personal.summary}
              </p>
            </section>
          )}
          {content.experience.length > 0 && (
            <section className="mb-5">
              <h3 className="border-b-2 border-[#1e3a5f] pb-1 text-[10px] font-bold uppercase tracking-wider text-[#1e3a5f]">
                Kinh nghiệm
              </h3>
              <ul className="mt-2 space-y-3">
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
            </section>
          )}
          {content.education.length > 0 && (
            <section className="mb-5">
              <h3 className="border-b-2 border-[#1e3a5f] pb-1 text-[10px] font-bold uppercase tracking-wider text-[#1e3a5f]">
                Học vấn
              </h3>
              <ul className="mt-2 space-y-2">
                {content.education.map((ed, i) => (
                  <li key={i}>
                    <p className="font-semibold text-slate-900">
                      {ed.school || "Trường"}
                    </p>
                    <p className="text-[10px] text-slate-600">{ed.major}</p>
                    {(ed.from || ed.to) && (
                      <p className="text-[9px] text-slate-500">
                        {[ed.from, ed.to].filter(Boolean).join(" – ")}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}
          {content.projects.length > 0 && (
            <section>
              <h3 className="border-b-2 border-[#1e3a5f] pb-1 text-[10px] font-bold uppercase tracking-wider text-[#1e3a5f]">
                Dự án
              </h3>
              <ul className="mt-2 space-y-2">
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
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
