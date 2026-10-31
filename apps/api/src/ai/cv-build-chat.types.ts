import { CvContent } from '../cvs/cv-content.schema';

export type CvBuildChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export type CvBuildChatResult = {
  message: string;
  content?: CvContent;
};

const PERSONAL_KEYS = [
  'fullName',
  'headline',
  'email',
  'phone',
  'city',
  'website',
  'summary',
  'interests',
  'references',
  'extraNotes',
] as const;

function asString(v: unknown, max = 8000): string | undefined {
  if (typeof v !== 'string') return undefined;
  const t = v.trim();
  return t ? t.slice(0, max) : undefined;
}

function asStringArray(v: unknown, max = 80): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((x) => typeof x === 'string' && x.trim())
    .map((x) => (x as string).trim().slice(0, 500))
    .slice(0, max);
}

function sanitizeContent(raw: unknown, base: CvContent): CvContent {
  if (!raw || typeof raw !== 'object') return base;
  const o = raw as Record<string, unknown>;
  const personalIn = (o.personal ?? {}) as Record<string, unknown>;
  const personal: CvContent['personal'] = { ...base.personal };
  for (const k of PERSONAL_KEYS) {
    const v = asString(personalIn[k], k === 'summary' ? 6000 : 500);
    if (v !== undefined) personal[k] = v;
  }

  const mapExp = (arr: unknown) => {
    if (!Array.isArray(arr)) return base.experience;
    return arr.slice(0, 30).map((item) => {
      const e = item as Record<string, unknown>;
      return {
        company: asString(e.company, 200),
        title: asString(e.title, 200),
        from: asString(e.from, 40),
        to: asString(e.to, 40),
        description: asString(e.description, 4000),
      };
    });
  };

  const mapEdu = (arr: unknown) => {
    if (!Array.isArray(arr)) return base.education;
    return arr.slice(0, 20).map((item) => {
      const e = item as Record<string, unknown>;
      return {
        school: asString(e.school, 200),
        major: asString(e.major, 200),
        from: asString(e.from, 40),
        to: asString(e.to, 40),
        description: asString(e.description, 2000),
      };
    });
  };

  const mapProjects = (arr: unknown) => {
    if (!Array.isArray(arr)) return base.projects;
    return arr.slice(0, 25).map((item) => {
      const e = item as Record<string, unknown>;
      return {
        name: asString(e.name, 200),
        description: asString(e.description, 2000),
        link: asString(e.link, 500),
      };
    });
  };

  let design = base.design;
  if (o.design && typeof o.design === 'object') {
    const d = o.design as Record<string, unknown>;
    design = {
      ...(base.design ?? {}),
      ...(asString(d.accentColor, 20)
        ? { accentColor: asString(d.accentColor, 20) }
        : {}),
    };
  }

  return {
    personal,
    education: mapEdu(o.education),
    experience: mapExp(o.experience),
    skills: o.skills ? asStringArray(o.skills) : base.skills,
    projects: mapProjects(o.projects),
    activities: Array.isArray(o.activities)
      ? o.activities.slice(0, 20).map((item) => {
          const a = item as Record<string, unknown>;
          return {
            organization: asString(a.organization, 200),
            role: asString(a.role, 200),
            from: asString(a.from, 40),
            to: asString(a.to, 40),
            description: asString(a.description, 3000),
          };
        })
      : base.activities,
    certificates: Array.isArray(o.certificates)
      ? o.certificates.slice(0, 30).map((item) => {
          const c = item as Record<string, unknown>;
          return {
            name: asString(c.name, 200),
            year: asString(c.year, 20),
          };
        })
      : base.certificates,
    awards: Array.isArray(o.awards)
      ? o.awards.slice(0, 30).map((item) => {
          const a = item as Record<string, unknown>;
          return {
            name: asString(a.name, 200),
            year: asString(a.year, 20),
          };
        })
      : base.awards,
    ...(design ? { design } : {}),
  };
}

function mergePartial(base: CvContent, partial: Record<string, unknown>): CvContent {
  const personal =
    partial.personal && typeof partial.personal === 'object'
      ? { ...base.personal, ...(partial.personal as CvContent['personal']) }
      : base.personal;
  return sanitizeContent({ ...base, ...partial, personal }, base);
}

export function parseCvBuildChatResponse(
  raw: string,
  currentContent: CvContent,
): CvBuildChatResult {
  const parsed = JSON.parse(raw) as {
    message?: unknown;
    content?: unknown;
    data?: unknown;
    patch?: unknown;
  };
  const message =
    typeof parsed.message === 'string'
      ? parsed.message.trim().slice(0, 8000)
      : 'Đã cập nhật CV.';
  const contentRaw = parsed.content ?? parsed.data;
  if (contentRaw && typeof contentRaw === 'object') {
    return {
      message,
      content: sanitizeContent(contentRaw, currentContent),
    };
  }
  if (parsed.patch && typeof parsed.patch === 'object') {
    return {
      message,
      content: mergePartial(currentContent, parsed.patch as Record<string, unknown>),
    };
  }
  return { message };
}

export function compactCvForPrompt(content: CvContent): string {
  const prune = (value: unknown): unknown => {
    if (value == null) return undefined;
    if (typeof value === 'string') {
      const t = value.trim();
      return t ? t : undefined;
    }
    if (Array.isArray(value)) {
      const items = value
        .map(prune)
        .filter((x) => x !== undefined && x !== null);
      return items.length ? items : undefined;
    }
    if (typeof value === 'object') {
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(value)) {
        const p = prune(v);
        if (p !== undefined && p !== null) out[k] = p;
      }
      return Object.keys(out).length ? out : undefined;
    }
    return value;
  };
  const compact = prune(content) ?? {};
  return JSON.stringify(compact).slice(0, 8_000);
}

export function cvContentSchemaHint(): string {
  return (
    '{ personal:{fullName,headline,email,phone,city,website,summary,...}, ' +
    'experience[], education[], skills[], projects[], activities[], certificates[], awards[] }'
  );
}
