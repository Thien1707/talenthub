"use client";

import { useEffect, useRef } from "react";

export function CvEditableField({
  value,
  placeholder,
  onCommit,
  className,
  multiline,
  block,
}: {
  value: string;
  placeholder?: string;
  onCommit: (next: string) => void;
  className?: string;
  multiline?: boolean;
  /** Hiển thị dạng block (h2/p) qua className từ parent */
  block?: boolean;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || document.activeElement === el) return;
    el.textContent = value || "";
  }, [value]);

  return (
    <span
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      role="textbox"
      data-placeholder={placeholder}
      className={`${block ? "block" : "inline"} ${className ?? ""} rounded-sm outline-none ring-blue-400 focus:ring-1 empty:before:text-opacity-60 empty:before:content-[attr(data-placeholder)]`}
      onBlur={(e: React.FocusEvent<HTMLSpanElement>) =>
        onCommit(e.currentTarget.innerText.replace(/\u00a0/g, " ").trim())
      }
      onKeyDown={(e: React.KeyboardEvent<HTMLSpanElement>) => {
        if (!multiline && e.key === "Enter") {
          e.preventDefault();
          e.currentTarget.blur();
        }
      }}
    />
  );
}
