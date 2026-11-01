import type { CvContent } from "@/lib/cv/types";

export function newCvEntryId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `cv-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function withIds<T extends { id?: string }>(items: T[] | undefined): T[] {
  return (items ?? []).map((item) => ({
    ...item,
    id: item.id ?? newCvEntryId(),
  }));
}

/** Gán id cho mục cũ (chưa có id) — tránh xóa nhầm sau reorder. */
export function ensureContentEntryIds(content: CvContent): CvContent {
  return {
    ...content,
    education: withIds(content.education),
    experience: withIds(content.experience),
    projects: withIds(content.projects),
    activities: withIds(content.activities),
    certificates: withIds(content.certificates),
    awards: withIds(content.awards),
    skills: content.skills ?? [],
  };
}

export function isBlankFields(
  record: Record<string, unknown>,
  keys: string[],
): boolean {
  return keys.every((k) => !String(record[k] ?? "").trim());
}

/** Loại mục trống trước khi lưu (kỹ năng dòng rỗng). */
export function sanitizeCvContentForSave(content: CvContent): CvContent {
  return {
    ...content,
    skills: content.skills.map((s) => s.trim()).filter(Boolean),
  };
}
