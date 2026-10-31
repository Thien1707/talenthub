"use client";

import type { ReactNode } from "react";
import { CvEditableField } from "@/components/student/cv-editable-field";
import { CvTopcvOrderedSections } from "@/components/student/cv-preview-sections";
import type { PersonalKey } from "@/lib/cv/edit-personal";
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

export function CvTopCvPreview({
  content,
  cvName,
  editable,
  onEditPersonal,
}: {
  content: CvContent;
  cvName: string;
  editable?: boolean;
  onEditPersonal?: (key: PersonalKey, value: string) => void;
}) {
  const name = content.personal.fullName?.trim() || cvName;
  const headline = content.personal.headline?.trim() ?? "";
  const commit = (key: PersonalKey, value: string) => onEditPersonal?.(key, value);

  const field = (
    key: PersonalKey,
    display: string,
    placeholder: string,
    className: string,
    multiline?: boolean,
    block?: boolean,
  ) =>
    editable && onEditPersonal ? (
      <CvEditableField
        block={block ?? multiline}
        multiline={multiline}
        value={content.personal[key] ?? ""}
        placeholder={placeholder}
        className={className}
        onCommit={(v) => commit(key, v)}
      />
    ) : (
      <>{display}</>
    );

  const contactLine = editable
    ? [
        field("phone", content.personal.phone ?? "", "SĐT", "inline min-w-[2rem]"),
        field("email", content.personal.email ?? "", "Email", "inline min-w-[2rem]"),
        field("website", content.personal.website ?? "", "Link", "inline min-w-[2rem]"),
        field("city", content.personal.city ?? "", "Thành phố", "inline min-w-[2rem]"),
      ].reduce<ReactNode[]>((acc, node, i) => {
        if (i > 0) acc.push("   ·   ");
        acc.push(node);
        return acc;
      }, [])
    : [
        content.personal.phone,
        content.personal.email,
        content.personal.website,
        content.personal.city,
      ]
        .filter(Boolean)
        .join("   ·   ");

  return (
    <div className="aspect-[210/297] w-full overflow-hidden rounded-lg border border-slate-200 bg-white p-6 shadow-lg">
      <div className="text-[11px] leading-snug text-slate-800">
        <h2 className="text-lg font-bold text-slate-900">
          {field("fullName", name, "Họ và tên", "min-w-[4rem]", false, true)}
        </h2>
        {(editable || headline) && (
          <p className="mt-0.5 text-[11px] font-medium text-slate-600">
            {field("headline", headline, "Vị trí mong muốn", "min-w-[4rem]", false, true)}
          </p>
        )}
        {(editable || (typeof contactLine === "string" && contactLine)) && (
          <p className="mt-2 text-[9px] text-slate-500">{contactLine}</p>
        )}

        {(editable || content.personal.summary?.trim()) && (
          <Section title="Mục tiêu nghề nghiệp">
            <p className="whitespace-pre-wrap text-[10px] text-justify text-slate-700">
              {field(
                "summary",
                content.personal.summary ?? "",
                "Mục tiêu / giới thiệu…",
                "min-h-[2rem] min-w-[4rem]",
                true,
                true,
              )}
            </p>
          </Section>
        )}

        <CvTopcvOrderedSections content={content} />

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

      </div>
    </div>
  );
}
