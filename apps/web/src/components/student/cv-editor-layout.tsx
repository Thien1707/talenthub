"use client";

import { Eye, LayoutTemplate, Sparkles, FileText } from "lucide-react";
import { useState, type ReactNode } from "react";

type EditorTab = "content" | "design" | "ai";

const tabs: { id: EditorTab; label: string; icon: typeof FileText }[] = [
  { id: "content", label: "Nội dung", icon: FileText },
  { id: "design", label: "Thiết kế", icon: LayoutTemplate },
  { id: "ai", label: "AI", icon: Sparkles },
];

export function CvEditorLayout({
  toolbar,
  contentPanel,
  designPanel,
  aiPanel,
  previewPanel,
  showContentEditor,
}: {
  toolbar: ReactNode;
  contentPanel: ReactNode;
  designPanel: ReactNode;
  aiPanel: ReactNode;
  previewPanel: ReactNode;
  showContentEditor: boolean;
}) {
  const [tab, setTab] = useState<EditorTab>("content");
  const [panelOpen, setPanelOpen] = useState(true);

  return (
    <div className="flex min-h-[calc(100dvh-10rem)] flex-col overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-sm">
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-white px-3 py-2">
        {toolbar}
      </div>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {showContentEditor && (
          <>
            <nav
              className="flex shrink-0 flex-row gap-1 border-b border-slate-200 bg-slate-50 px-2 py-2 lg:w-14 lg:flex-col lg:border-b-0 lg:border-r"
              aria-label="Panel CV"
            >
              {tabs.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  title={label}
                  onClick={() => {
                    setTab(id);
                    setPanelOpen(true);
                  }}
                  className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition lg:px-2 ${
                    tab === id && panelOpen
                      ? "bg-white text-blue-700 shadow-sm"
                      : "text-slate-600 hover:bg-white/80"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="lg:hidden">{label}</span>
                </button>
              ))}
              <button
                type="button"
                title="Ẩn panel / xem CV"
                onClick={() => setPanelOpen((o) => !o)}
                className="ml-auto flex items-center gap-1 rounded-lg px-2 py-2 text-slate-600 hover:bg-white lg:ml-0 lg:mt-auto"
              >
                <Eye className="h-4 w-4" />
                <span className="text-xs lg:sr-only">{panelOpen ? "Ẩn panel" : "Mở panel"}</span>
              </button>
            </nav>

            {panelOpen && (
              <aside className="flex max-h-[45vh] w-full shrink-0 flex-col overflow-hidden border-b border-slate-200 bg-white p-4 lg:max-h-none lg:w-[min(420px,38vw)] lg:border-b-0 lg:border-r">
                {tab === "content" && contentPanel}
                {tab === "design" && designPanel}
                {tab === "ai" && (
                  <div className="flex min-h-[min(420px,50vh)] flex-1 flex-col lg:min-h-[480px]">
                    {aiPanel}
                  </div>
                )}
              </aside>
            )}
          </>
        )}

        <div
          className="relative min-h-[320px] flex-1 overflow-auto bg-[linear-gradient(180deg,#e2e8f0_0%,#cbd5e1_100%)] p-4 lg:p-8"
          data-tour="canvas"
        >
          <div className="mx-auto flex min-h-full w-full max-w-[560px] items-start justify-center">
            {previewPanel}
          </div>
        </div>
      </div>
    </div>
  );
}
