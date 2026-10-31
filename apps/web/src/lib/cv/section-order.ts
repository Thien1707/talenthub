import type { CvContent } from "@/lib/cv/types";

export type CvSectionKey =
  | "skills"
  | "experience"
  | "education"
  | "projects"
  | "activities"
  | "certificates";

export const CV_SECTION_LABELS: Record<CvSectionKey, string> = {
  skills: "Kỹ năng",
  experience: "Kinh nghiệm",
  education: "Học vấn",
  projects: "Dự án",
  activities: "Hoạt động",
  certificates: "Chứng chỉ & giải thưởng",
};

export const DEFAULT_CV_SECTION_ORDER: CvSectionKey[] = [
  "skills",
  "experience",
  "education",
  "projects",
  "activities",
  "certificates",
];

export function resolveSectionOrder(content: CvContent): CvSectionKey[] {
  const raw = content.design?.sectionOrder;
  if (!raw?.length) return [...DEFAULT_CV_SECTION_ORDER];
  const valid = raw.filter((k): k is CvSectionKey =>
    DEFAULT_CV_SECTION_ORDER.includes(k as CvSectionKey),
  );
  const missing = DEFAULT_CV_SECTION_ORDER.filter((k) => !valid.includes(k));
  return [...valid, ...missing];
}

export function reorderSections(
  order: CvSectionKey[],
  activeId: CvSectionKey,
  overId: CvSectionKey,
): CvSectionKey[] {
  const oldIndex = order.indexOf(activeId);
  const newIndex = order.indexOf(overId);
  if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return order;
  const next = [...order];
  next.splice(oldIndex, 1);
  next.splice(newIndex, 0, activeId);
  return next;
}
