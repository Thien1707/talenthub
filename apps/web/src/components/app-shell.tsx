"use client";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { PageIntro } from "@/components/ui/page-intro";

type AppShellProps = {
  children: React.ReactNode;
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  narrow?: boolean;
  hideFooter?: boolean;
  /** Trang chủ kiểu Doory: hero full-width, không khung card. */
  marketing?: boolean;
};

export function AppShell({
  children,
  title,
  description,
  actions,
  narrow,
  hideFooter,
  marketing,
}: AppShellProps) {
  return (
    <div className="th-dotted-page flex min-h-screen flex-col text-slate-900">
      <SiteHeader />
      <main
        className={
          marketing
            ? "mx-auto w-full max-w-7xl flex-1 px-5 py-10 lg:px-8"
            : `mx-auto w-full flex-1 px-5 py-10 lg:px-8 ${
                narrow ? "max-w-lg" : "max-w-7xl"
              }`
        }
      >
        {title ? (
          <PageIntro title={title} description={description} actions={actions} />
        ) : null}
        {children}
      </main>
      {!hideFooter && <SiteFooter />}
    </div>
  );
}
