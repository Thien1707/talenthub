export function templateAccentColor(raw: unknown, fallback = "#1e3a5f"): string {
  if (!raw || typeof raw !== "object") return fallback;
  const c = raw as { accentColor?: string; primaryColor?: string };
  return c.accentColor ?? c.primaryColor ?? fallback;
}
