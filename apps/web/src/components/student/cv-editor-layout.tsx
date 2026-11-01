"use client";

import { Eye, LayoutTemplate, Sparkles, FileText } from "lucide-react";
import { useState, type ReactNode } from "react";
import styles from "./cv-editor-layout.module.css";

type EditorTab = "content" | "design" | "ai";

const allTabs: { id: EditorTab; label: string; icon: typeof FileText }[] = [
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
  editorTabs,
  initialTab = "content",
}: {
  toolbar: ReactNode;
  contentPanel: ReactNode;
  designPanel: ReactNode;
  aiPanel: ReactNode;
  previewPanel: ReactNode;
  showContentEditor: boolean;
  /** Mặc định: cả 3 tab. CV upload: chỉ `ai`. */
  editorTabs?: EditorTab[];
  initialTab?: EditorTab;
}) {
  const tabs = allTabs.filter((t) =>
    editorTabs ? editorTabs.includes(t.id) : true,
  );
  const defaultTab = tabs.some((t) => t.id === initialTab)
    ? initialTab
    : (tabs[0]?.id ?? "content");
  const [tab, setTab] = useState<EditorTab>(defaultTab);
  const [panelOpen, setPanelOpen] = useState(true);

  return (
    <div className={styles.shell}>
      <div className={styles.toolbar}>{toolbar}</div>

      <div className={styles.body}>
        {showContentEditor && (
          <>
            <nav className={styles.sideNav} aria-label="Panel CV">
              {tabs.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  title={label}
                  onClick={() => {
                    setTab(id);
                    setPanelOpen(true);
                  }}
                  className={`${styles.tabBtn} ${
                    tab === id && panelOpen ? styles.tabBtnActive : ""
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
                className={styles.eyeBtn}
              >
                <Eye className="h-4 w-4" />
                <span className="text-xs lg:sr-only">
                  {panelOpen ? "Ẩn panel" : "Mở panel"}
                </span>
              </button>
            </nav>

            {panelOpen && (
              <aside className={styles.sidePanel}>
                {tab === "content" ? (
                  <div className={styles.panelScroll}>{contentPanel}</div>
                ) : null}
                {tab === "design" ? (
                  <div className={styles.panelScroll}>{designPanel}</div>
                ) : null}
                {tab === "ai" ? (
                  <div className={`${styles.panelScroll} ${styles.aiPanel}`}>
                    {aiPanel}
                  </div>
                ) : null}
              </aside>
            )}
          </>
        )}

        <div className={styles.canvas} data-tour="canvas">
          <div className={styles.canvasInner}>{previewPanel}</div>
        </div>
      </div>
    </div>
  );
}
