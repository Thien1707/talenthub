export type GeminiAnalysisPayload = {
  score: number;
  skillMatchScore: number;
  experienceMatchScore: number;
  educationMatchScore: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  summary: string;
};

export function parseGeminiAnalysis(raw: string): GeminiAnalysisPayload {
  const parsed = JSON.parse(raw) as Partial<GeminiAnalysisPayload>;
  const clamp = (n: unknown) => {
    const v = Number(n);
    if (Number.isNaN(v)) return 0;
    return Math.min(100, Math.max(0, v));
  };
  const arr = (a: unknown) =>
    Array.isArray(a) ? a.filter((x) => typeof x === 'string').slice(0, 20) : [];
  return {
    score: clamp(parsed.score),
    skillMatchScore: clamp(parsed.skillMatchScore),
    experienceMatchScore: clamp(parsed.experienceMatchScore),
    educationMatchScore: clamp(parsed.educationMatchScore),
    strengths: arr(parsed.strengths),
    weaknesses: arr(parsed.weaknesses),
    recommendations: arr(parsed.recommendations),
    summary: typeof parsed.summary === 'string' ? parsed.summary.slice(0, 4000) : '',
  };
}
