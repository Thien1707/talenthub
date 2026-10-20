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
};

export function AppShell({
  children,
  title,
  description,
  actions,
  narrow,
  hideFooter,
}: AppShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <SiteHeader />
      <main
        className={`mx-auto w-full flex-1 px-5 py-10 lg:px-8 ${
          narrow ? "max-w-lg" : "max-w-7xl"
        }`}
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
