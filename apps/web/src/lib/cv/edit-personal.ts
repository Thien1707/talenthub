import type { CvContent } from "@/lib/cv/types";

export type PersonalKey = keyof CvContent["personal"];

export function patchPersonal(
  content: CvContent,
  key: PersonalKey,
  value: string,
): CvContent {
  return {
    ...content,
    personal: { ...content.personal, [key]: value },
  };
}
