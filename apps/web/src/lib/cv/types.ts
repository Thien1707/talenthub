import type { CvSectionKey } from "@/lib/cv/section-order";

export type CvContent = {
  personal: {
    fullName?: string;
    headline?: string;
    email?: string;
    phone?: string;
    city?: string;
    website?: string;
    summary?: string;
    interests?: string;
    references?: string;
    extraNotes?: string;
  };
  education: Array<{
    school?: string;
    major?: string;
    from?: string;
    to?: string;
    description?: string;
  }>;
  experience: Array<{
    company?: string;
    title?: string;
    from?: string;
    to?: string;
    description?: string;
  }>;
  skills: string[];
  projects: Array<{
    name?: string;
    description?: string;
    link?: string;
  }>;
  activities?: Array<{
    organization?: string;
    role?: string;
    from?: string;
    to?: string;
    description?: string;
  }>;
  certificates?: Array<{ name?: string; year?: string }>;
  awards?: Array<{ name?: string; year?: string }>;
  /** Tùy chỉnh giao diện (tham khảo CVAurum — lưu cùng contentJson). */
  design?: {
    accentColor?: string;
    sectionOrder?: CvSectionKey[];
  };
};

export function emptyCvContent(fullName?: string, email?: string): CvContent {
  return {
    personal: {
      fullName,
      email,
      phone: "",
      city: "",
      website: "",
      summary: "",
      interests: "",
      references: "",
      extraNotes: "",
    },
    education: [],
    experience: [],
    skills: [],
    projects: [],
    activities: [],
    certificates: [],
    awards: [],
  };
}

export type CvLayoutKey = "modern" | "topcv" | "classic";

export function resolveCvLayout(templateConfig: unknown): CvLayoutKey {
  if (templateConfig && typeof templateConfig === "object") {
    const layout = (templateConfig as { layout?: string }).layout;
    if (layout === "topcv") return "topcv";
    if (layout === "modern") return "modern";
    if (layout === "classic") return "classic";
  }
  return "modern";
}
