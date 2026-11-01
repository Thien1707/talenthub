import Link from "next/link";
import { Sparkles } from "lucide-react";

export function TalentHubLogo({ compact }: { compact?: boolean }) {
  return (
    <Link
      href="/"
      className="group flex items-center gap-2.5 rounded-lg outline-none focus-visible:ring-4 focus-visible:ring-violet-200"
    >
      <div className="grid h-9 w-9 place-items-center rounded-[10px] bg-slate-900 text-white shadow-[3px_3px_0_var(--color-cta-shadow)] transition group-hover:translate-x-[-1px] group-hover:translate-y-[-1px] group-hover:shadow-[4px_4px_0_var(--color-cta-shadow)] dark:bg-violet-700">
        <Sparkles className="h-5 w-5" aria-hidden />
      </div>
      {!compact && (
        <span className="font-display text-xl font-semibold tracking-tight text-[var(--ink)]">
          Talent<span className="text-violet-600 dark:text-violet-400">Hub</span>
        </span>
      )}
    </Link>
  );
}
