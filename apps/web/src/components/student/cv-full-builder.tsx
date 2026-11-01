"use client";

import {
  CvDeleteConfirmDialog,
  CvEntryDeleteButton,
  useCvEntryDelete,
} from "@/components/student/cv-repeatable-delete";
import { newCvEntryId } from "@/lib/cv/entry-id";
import type { CvSectionKey } from "@/lib/cv/section-order";
import { resolveSectionOrder } from "@/lib/cv/section-order";
import type { CvContent } from "@/lib/cv/types";
import { emptyCvContent } from "@/lib/cv/types";
import { useState } from "react";

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
      <section className="cv-form-section">
        <h3 className="font-semibold text-[var(--ink)]">Thông tin cá nhân</h3>
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
              <label className="cv-form-label">{label}</label>
              <input
                className="cv-form-input"
                value={content.personal[key] ?? ""}
                onChange={(e) => setPersonal(key, e.target.value)}
              />
            </div>
          ))}
        </div>
        <label className="mt-2 block cv-form-label">
          Mục tiêu nghề nghiệp / Giới thiệu
        </label>
        <textarea
          rows={3}
          className="cv-form-input"
          value={content.personal.summary ?? ""}
          onChange={(e) => setPersonal("summary", e.target.value)}
        />
        <label className="mt-2 block cv-form-label">
          Người giới thiệu
        </label>
        <input
          className="cv-form-input"
          placeholder="VD: Sẽ cung cấp khi có yêu cầu"
          value={content.personal.references ?? ""}
          onChange={(e) => setPersonal("references", e.target.value)}
        />
        <label className="mt-2 block cv-form-label">Sở thích</label>
        <input
          className="cv-form-input"
          value={content.personal.interests ?? ""}
          onChange={(e) => setPersonal("interests", e.target.value)}
        />
        <label className="mt-2 block cv-form-label">
          Thông tin thêm
        </label>
        <textarea
          rows={2}
          className="cv-form-input"
          value={content.personal.extraNotes ?? ""}
          onChange={(e) => setPersonal("extraNotes", e.target.value)}
        />
      </section>

      {resolveSectionOrder(content).map((key) => (
        <BuilderSectionBlock
          key={key}
          sectionKey={key}
          content={content}
          onChange={onChange}
        />
      ))}
    </div>
  );
}

function BuilderSectionBlock({
  sectionKey,
  content,
  onChange,
}: {
  sectionKey: CvSectionKey;
  content: CvContent;
  onChange: (c: CvContent) => void;
}) {
  switch (sectionKey) {
    case "skills":
      return <SkillsSection content={content} onChange={onChange} />;
    case "experience":
      return <ExpSection content={content} onChange={onChange} />;
    case "education":
      return <EduSection content={content} onChange={onChange} />;
    case "activities":
      return <ActivitySection content={content} onChange={onChange} />;
    case "certificates":
      return <CertAwardSection content={content} onChange={onChange} />;
    case "projects":
      return <ProjectSection content={content} onChange={onChange} />;
    default:
      return null;
  }
}

function ActivitySection({
  content,
  onChange,
}: {
  content: CvContent;
  onChange: (c: CvContent) => void;
}) {
  const activities = content.activities ?? [];
  const setActivities = (next: NonNullable<CvContent["activities"]>) =>
    onChange({ ...content, activities: next });

  const del = useCvEntryDelete(activities, setActivities, [
    "organization",
    "role",
    "from",
    "to",
    "description",
  ]);

  const add = () =>
    setActivities([
      ...activities,
      {
        id: newCvEntryId(),
        organization: "",
        role: "",
        from: "",
        to: "",
        description: "",
      },
    ]);
  return (
    <section className="cv-form-section">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-[var(--ink)]">Hoạt động</h3>
        <button type="button" className="cv-form-link" onClick={add}>
          + Thêm
        </button>
      </div>
      <CvDeleteConfirmDialog
        open={del.pendingOpen}
        onCancel={del.cancelDelete}
        onConfirm={del.confirmDelete}
      />
      {activities.map((act, i) => (
        <div
          key={act.id ?? `act-${i}`}
          className="cv-form-divider relative mt-3 grid gap-2 pt-3 sm:grid-cols-2"
        >
          <div className="absolute right-0 top-3 sm:col-span-2">
            <CvEntryDeleteButton onClick={() => del.requestDelete(act)} />
          </div>
          <input
            placeholder="Tổ chức / CLB"
            className="cv-form-input"
            value={act.organization ?? ""}
            onChange={(e) => {
              const next = [...activities];
              next[i] = { ...act, organization: e.target.value };
              onChange({ ...content, activities: next });
            }}
          />
          <input
            placeholder="Vai trò"
            className="cv-form-input"
            value={act.role ?? ""}
            onChange={(e) => {
              const next = [...activities];
              next[i] = { ...act, role: e.target.value };
              onChange({ ...content, activities: next });
            }}
          />
          <input
            placeholder="Từ"
            className="cv-form-input"
            value={act.from ?? ""}
            onChange={(e) => {
              const next = [...activities];
              next[i] = { ...act, from: e.target.value };
              onChange({ ...content, activities: next });
            }}
          />
          <input
            placeholder="Đến"
            className="cv-form-input"
            value={act.to ?? ""}
            onChange={(e) => {
              const next = [...activities];
              next[i] = { ...act, to: e.target.value };
              onChange({ ...content, activities: next });
            }}
          />
          <textarea
            placeholder="Mô tả (mỗi dòng một ý)"
            className="sm:col-span-2 cv-form-input"
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

  const setCertificates = (next: NonNullable<CvContent["certificates"]>) =>
    onChange({ ...content, certificates: next });
  const setAwards = (next: NonNullable<CvContent["awards"]>) =>
    onChange({ ...content, awards: next });

  const delCert = useCvEntryDelete(certificates, setCertificates, ["name", "year"]);
  const delAward = useCvEntryDelete(awards, setAwards, ["name", "year"]);

  return (
    <section className="cv-form-section">
      <h3 className="font-semibold text-[var(--ink)]">Chứng chỉ &amp; giải thưởng</h3>
      <p className="mt-1 cv-form-muted">Dùng cho mẫu TopCV.</p>
      <CvDeleteConfirmDialog
        open={delCert.pendingOpen}
        onCancel={delCert.cancelDelete}
        onConfirm={delCert.confirmDelete}
      />
      <CvDeleteConfirmDialog
        open={delAward.pendingOpen}
        onCancel={delAward.cancelDelete}
        onConfirm={delAward.confirmDelete}
      />
      <div className="mt-3">
        <p className="cv-form-subhead">Chứng chỉ</p>
        {certificates.map((c, i) => (
          <div key={c.id ?? `cert-${i}`} className="mt-2 flex items-start gap-2">
            <input
              placeholder="Tên chứng chỉ"
              className="flex-1 cv-form-input"
              value={c.name ?? ""}
              onChange={(e) => {
                const next = [...certificates];
                next[i] = { ...c, name: e.target.value };
                onChange({ ...content, certificates: next });
              }}
            />
            <input
              placeholder="Năm"
              className="w-24 cv-form-input"
              value={c.year ?? ""}
              onChange={(e) => {
                const next = [...certificates];
                next[i] = { ...c, year: e.target.value };
                onChange({ ...content, certificates: next });
              }}
            />
            <CvEntryDeleteButton onClick={() => delCert.requestDelete(c)} />
          </div>
        ))}
        <button
          type="button"
          className="mt-2 cv-form-link"
          onClick={() =>
            setCertificates([
              ...certificates,
              { id: newCvEntryId(), name: "", year: "" },
            ])
          }
        >
          + Chứng chỉ
        </button>
      </div>
      <div className="mt-4">
        <p className="cv-form-subhead">Danh hiệu / giải</p>
        {awards.map((a, i) => (
          <div key={a.id ?? `award-${i}`} className="mt-2 flex items-start gap-2">
            <input
              placeholder="Danh hiệu"
              className="flex-1 cv-form-input"
              value={a.name ?? ""}
              onChange={(e) => {
                const next = [...awards];
                next[i] = { ...a, name: e.target.value };
                onChange({ ...content, awards: next });
              }}
            />
            <input
              placeholder="Năm"
              className="w-24 cv-form-input"
              value={a.year ?? ""}
              onChange={(e) => {
                const next = [...awards];
                next[i] = { ...a, year: e.target.value };
                onChange({ ...content, awards: next });
              }}
            />
            <CvEntryDeleteButton onClick={() => delAward.requestDelete(a)} />
          </div>
        ))}
        <button
          type="button"
          className="mt-2 cv-form-link"
          onClick={() =>
            setAwards([...awards, { id: newCvEntryId(), name: "", year: "" }])
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
  const setProjects = (projects: CvContent["projects"]) =>
    onChange({ ...content, projects });

  const del = useCvEntryDelete(content.projects, setProjects, [
    "name",
    "description",
    "link",
  ]);

  const add = () =>
    setProjects([
      ...content.projects,
      { id: newCvEntryId(), name: "", description: "", link: "" },
    ]);
  return (
    <section className="cv-form-section">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-[var(--ink)]">Dự án</h3>
        <button type="button" className="cv-form-link" onClick={add}>
          + Thêm
        </button>
      </div>
      <CvDeleteConfirmDialog
        open={del.pendingOpen}
        onCancel={del.cancelDelete}
        onConfirm={del.confirmDelete}
      />
      {content.projects.map((p, i) => (
        <div
          key={p.id ?? `proj-${i}`}
          className="cv-form-divider relative mt-3 grid gap-2 pt-3"
        >
          <div className="flex justify-end">
            <CvEntryDeleteButton onClick={() => del.requestDelete(p)} />
          </div>
          <input
            placeholder="Tên dự án"
            className="cv-form-input"
            value={p.name ?? ""}
            onChange={(e) => {
              const projects = [...content.projects];
              projects[i] = { ...p, name: e.target.value };
              onChange({ ...content, projects });
            }}
          />
          <textarea
            placeholder="Mô tả"
            className="cv-form-input"
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
            className="cv-form-input"
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

function SkillsSection({
  content,
  onChange,
}: {
  content: CvContent;
  onChange: (c: CvContent) => void;
}) {
  const skills = content.skills;
  const setSkills = (next: string[]) => onChange({ ...content, skills: next });
  const [pendingIndex, setPendingIndex] = useState<number | null>(null);

  const requestDelete = (index: number) => {
    const value = skills[index]?.trim() ?? "";
    if (!value) {
      setSkills(skills.filter((_, i) => i !== index));
      return;
    }
    setPendingIndex(index);
  };

  const confirmDelete = () => {
    if (pendingIndex != null) {
      setSkills(skills.filter((_, i) => i !== pendingIndex));
    }
    setPendingIndex(null);
  };

  return (
    <section className="cv-form-section">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-[var(--ink)]">Kỹ năng</h3>
        <button
          type="button"
          className="cv-form-link"
          onClick={() => setSkills([...skills, ""])}
        >
          + Thêm
        </button>
      </div>
      <CvDeleteConfirmDialog
        open={pendingIndex != null}
        onCancel={() => setPendingIndex(null)}
        onConfirm={confirmDelete}
      />
      <ul className="mt-3 space-y-2">
        {skills.map((skill, i) => (
          <li key={`skill-${i}-${skill.slice(0, 12)}`} className="flex gap-2">
            <input
              className="flex-1 cv-form-input"
              placeholder="VD: TypeScript"
              value={skill}
              onChange={(e) => {
                const next = [...skills];
                next[i] = e.target.value;
                setSkills(next);
              }}
            />
            <CvEntryDeleteButton onClick={() => requestDelete(i)} />
          </li>
        ))}
      </ul>
      {skills.length === 0 ? (
        <p className="mt-2 text-sm text-slate-500">
          Chưa có kỹ năng — bấm + Thêm hoặc nhập từng dòng.
        </p>
      ) : null}
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
  const setExperience = (experience: CvContent["experience"]) =>
    onChange({ ...content, experience });

  const del = useCvEntryDelete(content.experience, setExperience, [
    "company",
    "title",
    "from",
    "to",
    "description",
  ]);

  const add = () =>
    setExperience([
      ...content.experience,
      {
        id: newCvEntryId(),
        company: "",
        title: "",
        from: "",
        to: "",
        description: "",
      },
    ]);
  return (
    <section className="cv-form-section">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-[var(--ink)]">Kinh nghiệm</h3>
        <button type="button" className="cv-form-link" onClick={add}>
          + Thêm
        </button>
      </div>
      <CvDeleteConfirmDialog
        open={del.pendingOpen}
        onCancel={del.cancelDelete}
        onConfirm={del.confirmDelete}
      />
      {content.experience.map((ex, i) => (
        <div
          key={ex.id ?? `exp-${i}`}
          className="cv-form-divider relative mt-3 grid gap-2 pt-3 sm:grid-cols-2"
        >
          <div className="absolute right-0 top-3 sm:col-span-2">
            <CvEntryDeleteButton onClick={() => del.requestDelete(ex)} />
          </div>
          <input
            placeholder="Công ty"
            className="cv-form-input"
            value={ex.company ?? ""}
            onChange={(e) => {
              const experience = [...content.experience];
              experience[i] = { ...ex, company: e.target.value };
              onChange({ ...content, experience });
            }}
          />
          <input
            placeholder="Vị trí"
            className="cv-form-input"
            value={ex.title ?? ""}
            onChange={(e) => {
              const experience = [...content.experience];
              experience[i] = { ...ex, title: e.target.value };
              onChange({ ...content, experience });
            }}
          />
          <input
            placeholder="Từ (VD: 2022)"
            className="cv-form-input"
            value={ex.from ?? ""}
            onChange={(e) => {
              const experience = [...content.experience];
              experience[i] = { ...ex, from: e.target.value };
              onChange({ ...content, experience });
            }}
          />
          <input
            placeholder="Đến (VD: Nay)"
            className="cv-form-input"
            value={ex.to ?? ""}
            onChange={(e) => {
              const experience = [...content.experience];
              experience[i] = { ...ex, to: e.target.value };
              onChange({ ...content, experience });
            }}
          />
          <textarea
            placeholder="Mô tả (mỗi dòng một ý)"
            className="sm:col-span-2 cv-form-input"
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
  const setEducation = (education: CvContent["education"]) =>
    onChange({ ...content, education });

  const del = useCvEntryDelete(content.education, setEducation, [
    "school",
    "major",
    "from",
    "to",
    "description",
  ]);

  const add = () =>
    setEducation([
      ...content.education,
      {
        id: newCvEntryId(),
        school: "",
        major: "",
        from: "",
        to: "",
        description: "",
      },
    ]);
  return (
    <section className="cv-form-section">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-[var(--ink)]">Học vấn</h3>
        <button type="button" className="cv-form-link" onClick={add}>
          + Thêm
        </button>
      </div>
      <CvDeleteConfirmDialog
        open={del.pendingOpen}
        onCancel={del.cancelDelete}
        onConfirm={del.confirmDelete}
      />
      {content.education.map((ed, i) => (
        <div
          key={ed.id ?? `edu-${i}`}
          className="cv-form-divider relative mt-3 grid gap-2 pt-3 sm:grid-cols-2"
        >
          <div className="absolute right-0 top-3 sm:col-span-2">
            <CvEntryDeleteButton onClick={() => del.requestDelete(ed)} />
          </div>
          <input
            placeholder="Trường"
            className="cv-form-input"
            value={ed.school ?? ""}
            onChange={(e) => {
              const education = [...content.education];
              education[i] = { ...ed, school: e.target.value };
              onChange({ ...content, education });
            }}
          />
          <input
            placeholder="Chuyên ngành"
            className="cv-form-input"
            value={ed.major ?? ""}
            onChange={(e) => {
              const education = [...content.education];
              education[i] = { ...ed, major: e.target.value };
              onChange({ ...content, education });
            }}
          />
          <input
            placeholder="Từ"
            className="cv-form-input"
            value={ed.from ?? ""}
            onChange={(e) => {
              const education = [...content.education];
              education[i] = { ...ed, from: e.target.value };
              onChange({ ...content, education });
            }}
          />
          <input
            placeholder="Đến"
            className="cv-form-input"
            value={ed.to ?? ""}
            onChange={(e) => {
              const education = [...content.education];
              education[i] = { ...ed, to: e.target.value };
              onChange({ ...content, education });
            }}
          />
          <input
            placeholder="Ghi chú (tùy chọn)"
            className="sm:col-span-2 cv-form-input"
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
