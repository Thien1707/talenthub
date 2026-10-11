"use client";

import type { CvContent } from "@/lib/cv/types";
import { emptyCvContent } from "@/lib/cv/types";

export function emptyBuilderContent(): CvContent {
  return emptyCvContent();
}

export function CvFullBuilder({
  content,
  onChange,
}: {
  content: CvContent;
  onChange: (next: CvContent) => void;
}) {
  const setPersonal = (key: keyof CvContent["personal"], value: string) => {
    onChange({
      ...content,
      personal: { ...content.personal, [key]: value },
    });
  };

  return (
    <div className="space-y-6">
      <section className="rounded-xl border bg-white p-4">
        <h3 className="font-semibold text-slate-900">Thông tin cá nhân</h3>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {(
            [
              ["fullName", "Họ tên"],
              ["headline", "Vị trí / headline"],
              ["email", "Email"],
              ["phone", "SĐT"],
              ["city", "Thành phố"],
              ["website", "Link (Facebook, portfolio…)"],
            ] as const
          ).map(([key, label]) => (
            <div key={key}>
              <label className="text-xs text-slate-600">{label}</label>
              <input
                className="w-full rounded border px-2 py-1.5 text-sm"
                value={content.personal[key] ?? ""}
                onChange={(e) => setPersonal(key, e.target.value)}
              />
            </div>
          ))}
        </div>
        <label className="mt-2 block text-xs text-slate-600">
          Mục tiêu nghề nghiệp / Giới thiệu
        </label>
        <textarea
          rows={3}
          className="w-full rounded border px-2 py-1.5 text-sm"
          value={content.personal.summary ?? ""}
          onChange={(e) => setPersonal("summary", e.target.value)}
        />
        <label className="mt-2 block text-xs text-slate-600">
          Người giới thiệu
        </label>
        <input
          className="w-full rounded border px-2 py-1.5 text-sm"
          placeholder="VD: Sẽ cung cấp khi có yêu cầu"
          value={content.personal.references ?? ""}
          onChange={(e) => setPersonal("references", e.target.value)}
        />
        <label className="mt-2 block text-xs text-slate-600">Sở thích</label>
        <input
          className="w-full rounded border px-2 py-1.5 text-sm"
          value={content.personal.interests ?? ""}
          onChange={(e) => setPersonal("interests", e.target.value)}
        />
        <label className="mt-2 block text-xs text-slate-600">
          Thông tin thêm
        </label>
        <textarea
          rows={2}
          className="w-full rounded border px-2 py-1.5 text-sm"
          value={content.personal.extraNotes ?? ""}
          onChange={(e) => setPersonal("extraNotes", e.target.value)}
        />
      </section>

      <SectionList
        title="Kỹ năng (mỗi dòng một kỹ năng)"
        rows={content.skills}
        onRows={(skills) => onChange({ ...content, skills })}
        placeholder="VD: TypeScript"
      />

      <ExpSection content={content} onChange={onChange} />
      <EduSection content={content} onChange={onChange} />
      <ActivitySection content={content} onChange={onChange} />
      <CertAwardSection content={content} onChange={onChange} />
      <ProjectSection content={content} onChange={onChange} />
    </div>
  );
}

function ActivitySection({
  content,
  onChange,
}: {
  content: CvContent;
  onChange: (c: CvContent) => void;
}) {
  const activities = content.activities ?? [];
  const add = () =>
    onChange({
      ...content,
      activities: [
        ...activities,
        {
          organization: "",
          role: "",
          from: "",
          to: "",
          description: "",
        },
      ],
    });
  return (
    <section className="rounded-xl border bg-white p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-900">Hoạt động</h3>
        <button type="button" className="text-sm text-blue-700" onClick={add}>
          + Thêm
        </button>
      </div>
      {activities.map((act, i) => (
        <div key={i} className="mt-3 grid gap-2 border-t pt-3 sm:grid-cols-2">
          <input
            placeholder="Tổ chức / CLB"
            className="rounded border px-2 py-1 text-sm"
            value={act.organization ?? ""}
            onChange={(e) => {
              const next = [...activities];
              next[i] = { ...act, organization: e.target.value };
              onChange({ ...content, activities: next });
            }}
          />
          <input
            placeholder="Vai trò"
            className="rounded border px-2 py-1 text-sm"
            value={act.role ?? ""}
            onChange={(e) => {
              const next = [...activities];
              next[i] = { ...act, role: e.target.value };
              onChange({ ...content, activities: next });
            }}
          />
          <input
            placeholder="Từ"
            className="rounded border px-2 py-1 text-sm"
            value={act.from ?? ""}
            onChange={(e) => {
              const next = [...activities];
              next[i] = { ...act, from: e.target.value };
              onChange({ ...content, activities: next });
            }}
          />
          <input
            placeholder="Đến"
            className="rounded border px-2 py-1 text-sm"
            value={act.to ?? ""}
            onChange={(e) => {
              const next = [...activities];
              next[i] = { ...act, to: e.target.value };
              onChange({ ...content, activities: next });
            }}
          />
          <textarea
            placeholder="Mô tả (mỗi dòng một ý)"
            className="sm:col-span-2 rounded border px-2 py-1 text-sm"
            rows={2}
            value={act.description ?? ""}
            onChange={(e) => {
              const next = [...activities];
              next[i] = { ...act, description: e.target.value };
              onChange({ ...content, activities: next });
            }}
          />
        </div>
      ))}
    </section>
  );
}

function CertAwardSection({
  content,
  onChange,
}: {
  content: CvContent;
  onChange: (c: CvContent) => void;
}) {
  const certificates = content.certificates ?? [];
  const awards = content.awards ?? [];
  return (
    <section className="rounded-xl border bg-white p-4">
      <h3 className="font-semibold text-slate-900">Chứng chỉ &amp; giải thưởng</h3>
      <p className="mt-1 text-xs text-slate-500">Dùng cho mẫu TopCV.</p>
      <div className="mt-3">
        <p className="text-sm font-medium text-slate-800">Chứng chỉ</p>
        {certificates.map((c, i) => (
          <div key={i} className="mt-2 flex gap-2">
            <input
              placeholder="Tên chứng chỉ"
              className="flex-1 rounded border px-2 py-1 text-sm"
              value={c.name ?? ""}
              onChange={(e) => {
                const next = [...certificates];
                next[i] = { ...c, name: e.target.value };
                onChange({ ...content, certificates: next });
              }}
            />
            <input
              placeholder="Năm"
              className="w-24 rounded border px-2 py-1 text-sm"
              value={c.year ?? ""}
              onChange={(e) => {
                const next = [...certificates];
                next[i] = { ...c, year: e.target.value };
                onChange({ ...content, certificates: next });
              }}
            />
          </div>
        ))}
        <button
          type="button"
          className="mt-2 text-sm text-blue-700"
          onClick={() =>
            onChange({
              ...content,
              certificates: [...certificates, { name: "", year: "" }],
            })
          }
        >
          + Chứng chỉ
        </button>
      </div>
      <div className="mt-4">
        <p className="text-sm font-medium text-slate-800">Danh hiệu / giải</p>
        {awards.map((a, i) => (
          <div key={i} className="mt-2 flex gap-2">
            <input
              placeholder="Danh hiệu"
              className="flex-1 rounded border px-2 py-1 text-sm"
              value={a.name ?? ""}
              onChange={(e) => {
                const next = [...awards];
                next[i] = { ...a, name: e.target.value };
                onChange({ ...content, awards: next });
              }}
            />
            <input
              placeholder="Năm"
              className="w-24 rounded border px-2 py-1 text-sm"
              value={a.year ?? ""}
              onChange={(e) => {
                const next = [...awards];
                next[i] = { ...a, year: e.target.value };
                onChange({ ...content, awards: next });
              }}
            />
          </div>
        ))}
        <button
          type="button"
          className="mt-2 text-sm text-blue-700"
          onClick={() =>
            onChange({
              ...content,
              awards: [...awards, { name: "", year: "" }],
            })
          }
        >
          + Danh hiệu
        </button>
      </div>
    </section>
  );
}

function ProjectSection({
  content,
  onChange,
}: {
  content: CvContent;
  onChange: (c: CvContent) => void;
}) {
  const add = () =>
    onChange({
      ...content,
      projects: [...content.projects, { name: "", description: "", link: "" }],
    });
  return (
    <section className="rounded-xl border bg-white p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-900">Dự án</h3>
        <button type="button" className="text-sm text-blue-700" onClick={add}>
          + Thêm
        </button>
      </div>
      {content.projects.map((p, i) => (
        <div key={i} className="mt-3 grid gap-2 border-t pt-3">
          <input
            placeholder="Tên dự án"
            className="rounded border px-2 py-1 text-sm"
            value={p.name ?? ""}
            onChange={(e) => {
              const projects = [...content.projects];
              projects[i] = { ...p, name: e.target.value };
              onChange({ ...content, projects });
            }}
          />
          <textarea
            placeholder="Mô tả"
            className="rounded border px-2 py-1 text-sm"
            rows={2}
            value={p.description ?? ""}
            onChange={(e) => {
              const projects = [...content.projects];
              projects[i] = { ...p, description: e.target.value };
              onChange({ ...content, projects });
            }}
          />
          <input
            placeholder="Link (tùy chọn)"
            className="rounded border px-2 py-1 text-sm"
            value={p.link ?? ""}
            onChange={(e) => {
              const projects = [...content.projects];
              projects[i] = { ...p, link: e.target.value };
              onChange({ ...content, projects });
            }}
          />
        </div>
      ))}
    </section>
  );
}

function SectionList({
  title,
  rows,
  onRows,
  placeholder,
}: {
  title: string;
  rows: string[];
  onRows: (r: string[]) => void;
  placeholder: string;
}) {
  const text = rows.join("\n");
  return (
    <section className="rounded-xl border bg-white p-4">
      <h3 className="font-semibold text-slate-900">{title}</h3>
      <textarea
        rows={4}
        className="mt-2 w-full rounded border px-2 py-1.5 text-sm"
        placeholder={placeholder}
        value={text}
        onChange={(e) =>
          onRows(
            e.target.value
              .split("\n")
              .map((s) => s.trim())
              .filter(Boolean),
          )
        }
      />
    </section>
  );
}

function ExpSection({
  content,
  onChange,
}: {
  content: CvContent;
  onChange: (c: CvContent) => void;
}) {
  const add = () =>
    onChange({
      ...content,
      experience: [
        ...content.experience,
        { company: "", title: "", from: "", to: "", description: "" },
      ],
    });
  return (
    <section className="rounded-xl border bg-white p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-900">Kinh nghiệm</h3>
        <button type="button" className="text-sm text-blue-700" onClick={add}>
          + Thêm
        </button>
      </div>
      {content.experience.map((ex, i) => (
        <div key={i} className="mt-3 grid gap-2 border-t pt-3 sm:grid-cols-2">
          <input
            placeholder="Công ty"
            className="rounded border px-2 py-1 text-sm"
            value={ex.company ?? ""}
            onChange={(e) => {
              const experience = [...content.experience];
              experience[i] = { ...ex, company: e.target.value };
              onChange({ ...content, experience });
            }}
          />
          <input
            placeholder="Vị trí"
            className="rounded border px-2 py-1 text-sm"
            value={ex.title ?? ""}
            onChange={(e) => {
              const experience = [...content.experience];
              experience[i] = { ...ex, title: e.target.value };
              onChange({ ...content, experience });
            }}
          />
          <input
            placeholder="Từ (VD: 2022)"
            className="rounded border px-2 py-1 text-sm"
            value={ex.from ?? ""}
            onChange={(e) => {
              const experience = [...content.experience];
              experience[i] = { ...ex, from: e.target.value };
              onChange({ ...content, experience });
            }}
          />
          <input
            placeholder="Đến (VD: Nay)"
            className="rounded border px-2 py-1 text-sm"
            value={ex.to ?? ""}
            onChange={(e) => {
              const experience = [...content.experience];
              experience[i] = { ...ex, to: e.target.value };
              onChange({ ...content, experience });
            }}
          />
          <textarea
            placeholder="Mô tả (mỗi dòng một ý)"
            className="sm:col-span-2 rounded border px-2 py-1 text-sm"
            rows={2}
            value={ex.description ?? ""}
            onChange={(e) => {
              const experience = [...content.experience];
              experience[i] = { ...ex, description: e.target.value };
              onChange({ ...content, experience });
            }}
          />
        </div>
      ))}
    </section>
  );
}

function EduSection({
  content,
  onChange,
}: {
  content: CvContent;
  onChange: (c: CvContent) => void;
}) {
  const add = () =>
    onChange({
      ...content,
      education: [
        ...content.education,
        { school: "", major: "", from: "", to: "", description: "" },
      ],
    });
  return (
    <section className="rounded-xl border bg-white p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-900">Học vấn</h3>
        <button type="button" className="text-sm text-blue-700" onClick={add}>
          + Thêm
        </button>
      </div>
      {content.education.map((ed, i) => (
        <div key={i} className="mt-3 grid gap-2 border-t pt-3 sm:grid-cols-2">
          <input
            placeholder="Trường"
            className="rounded border px-2 py-1 text-sm"
            value={ed.school ?? ""}
            onChange={(e) => {
              const education = [...content.education];
              education[i] = { ...ed, school: e.target.value };
              onChange({ ...content, education });
            }}
          />
          <input
            placeholder="Chuyên ngành"
            className="rounded border px-2 py-1 text-sm"
            value={ed.major ?? ""}
            onChange={(e) => {
              const education = [...content.education];
              education[i] = { ...ed, major: e.target.value };
              onChange({ ...content, education });
            }}
          />
          <input
            placeholder="Từ"
            className="rounded border px-2 py-1 text-sm"
            value={ed.from ?? ""}
            onChange={(e) => {
              const education = [...content.education];
              education[i] = { ...ed, from: e.target.value };
              onChange({ ...content, education });
            }}
          />
          <input
            placeholder="Đến"
            className="rounded border px-2 py-1 text-sm"
            value={ed.to ?? ""}
            onChange={(e) => {
              const education = [...content.education];
              education[i] = { ...ed, to: e.target.value };
              onChange({ ...content, education });
            }}
          />
          <input
            placeholder="Ghi chú (tùy chọn)"
            className="sm:col-span-2 rounded border px-2 py-1 text-sm"
            value={ed.description ?? ""}
            onChange={(e) => {
              const education = [...content.education];
              education[i] = { ...ed, description: e.target.value };
              onChange({ ...content, education });
            }}
          />
        </div>
      ))}
    </section>
  );
}
