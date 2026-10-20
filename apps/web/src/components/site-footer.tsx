import Link from "next/link";
import { TalentHubLogo } from "@/components/ui/talenthub-logo";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-8 sm:flex-row sm:items-center sm:justify-between lg:px-8">
        <TalentHubLogo />
        <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium text-slate-600">
          <Link href="/viec-lam" className="hover:text-blue-600">
            Việc làm
          </Link>
          <Link href="/dang-ky?role=student" className="hover:text-blue-600">
            Ứng viên
          </Link>
          <Link href="/dang-ky?role=company" className="hover:text-blue-600">
            Nhà tuyển dụng
          </Link>
          <Link href="/bao-cao" className="hover:text-blue-600">
            Báo cáo vi phạm
          </Link>
        </nav>
        <p className="text-sm text-slate-400">
          © {new Date().getFullYear()} TalentHub
        </p>
      </div>
    </footer>
  );
}
