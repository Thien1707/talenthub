import { emptyCvContent, type CvContent } from "@/lib/cv/types";

/** API có thể lưu `{ format: 'cvaurum', document }` — chuyển về CvContent cho builder web. */
export function normalizeCvContentJson(raw: unknown): CvContent {
  if (!raw || typeof raw !== "object") {
    return emptyCvContent();
  }

  const obj = raw as Record<string, unknown>;

  if (obj.format === "cvaurum" && obj.document && typeof obj.document === "object") {
    return cvaurumDocumentToContent(obj.document as CvAurumDocument);
  }

  if ("personal" in obj && typeof obj.personal === "object") {
    return mergeWithDefaults(obj as CvContent);
  }

  return emptyCvContent();
}

type CvAurumDocument = {
  content?: {
    basics?: {
      name?: string;
      label?: string;
      email?: string;
      phone?: string;
      summary?: string;
      url?: string;
      location?: { city?: string };
    };
    work?: Array<{
      company?: string;
      name?: string;
      position?: string;
      startDate?: string;
      endDate?: string;
      summary?: string;
    }>;
    education?: Array<{
      institution?: string;
      area?: string;
      startDate?: string;
      endDate?: string;
      summary?: string;
    }>;
    skills?: Array<{ name?: string }>;
    projects?: Array<{ name?: string; description?: string; url?: string }>;
    volunteer?: Array<{
      organization?: string;
      position?: string;
      startDate?: string;
      endDate?: string;
      summary?: string;
    }>;
    certificates?: Array<{ name?: string; date?: string }>;
    awards?: Array<{ title?: string; date?: string }>;
  };
};

function cvaurumDocumentToContent(doc: CvAurumDocument): CvContent {
  const b = doc.content?.basics ?? {};
  const base = emptyCvContent(b.name, b.email);

  base.personal.headline = b.label ?? "";
  base.personal.phone = b.phone ?? "";
  base.personal.summary = b.summary ?? "";
  base.personal.website = b.url ?? "";
  base.personal.city = b.location?.city ?? "";

  base.experience = (doc.content?.work ?? []).map((w) => ({
    company: w.company ?? w.name ?? "",
    title: w.position ?? "",
    from: w.startDate ?? "",
    to: w.endDate ?? "",
    description: w.summary ?? "",
  }));

  base.education = (doc.content?.education ?? []).map((e) => ({
    school: e.institution ?? "",
    major: e.area ?? "",
    from: e.startDate ?? "",
    to: e.endDate ?? "",
    description: e.summary ?? "",
  }));

  base.skills = (doc.content?.skills ?? [])
    .map((s) => s.name?.trim())
    .filter(Boolean) as string[];

  base.projects = (doc.content?.projects ?? []).map((p) => ({
    name: p.name ?? "",
    description: p.description ?? "",
    link: p.url ?? "",
  }));

  base.activities = (doc.content?.volunteer ?? []).map((v) => ({
    organization: v.organization ?? "",
    role: v.position ?? "",
    from: v.startDate ?? "",
    to: v.endDate ?? "",
    description: v.summary ?? "",
  }));

  base.certificates = (doc.content?.certificates ?? []).map((c) => ({
    name: c.name ?? "",
    year: c.date ?? "",
  }));

  base.awards = (doc.content?.awards ?? []).map((a) => ({
    name: a.title ?? "",
    year: a.date ?? "",
  }));

  return base;
}

export function mergeWithDefaults(partial: CvContent): CvContent {
  const base = emptyCvContent();
  return {
    ...base,
    ...partial,
    personal: { ...base.personal, ...partial.personal },
    education: partial.education ?? [],
    experience: partial.experience ?? [],
    skills: partial.skills ?? [],
    projects: partial.projects ?? [],
    activities: partial.activities ?? [],
    certificates: partial.certificates ?? [],
    awards: partial.awards ?? [],
    design: partial.design,
  };
}
