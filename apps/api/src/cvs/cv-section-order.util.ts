import type { CvContent } from './cv-content.schema';

export type CvSectionKey =
  | 'skills'
  | 'experience'
  | 'education'
  | 'projects'
  | 'activities'
  | 'certificates';

const DEFAULT_ORDER: CvSectionKey[] = [
  'skills',
  'experience',
  'education',
  'projects',
  'activities',
  'certificates',
];

export function resolveSectionOrder(content: CvContent): CvSectionKey[] {
  const raw = content.design?.sectionOrder;
  if (!raw?.length) return [...DEFAULT_ORDER];
  const valid = raw.filter((k): k is CvSectionKey =>
    DEFAULT_ORDER.includes(k as CvSectionKey),
  );
  const missing = DEFAULT_ORDER.filter((k) => !valid.includes(k));
  return [...valid, ...missing];
}
