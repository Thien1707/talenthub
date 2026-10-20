import Link from "next/link";
import { Sparkles } from "lucide-react";

export function TalentHubLogo({ compact }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5 outline-none focus-visible:ring-4 focus-visible:ring-blue-100 rounded-lg">
      <div className="grid h-9 w-9 place-items-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-200">
        <Sparkles className="h-5 w-5" aria-hidden />
      </div>
      {!compact && (
        <span className="text-xl font-extrabold tracking-tight text-slate-900">
          Talent<span className="text-blue-600">Hub</span>
        </span>
      )}
    </Link>
  );
}
