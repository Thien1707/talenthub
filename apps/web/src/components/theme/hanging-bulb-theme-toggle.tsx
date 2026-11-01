"use client";

import { useEffect, useState } from "react";
import { useTheme } from "@/components/theme/theme-provider";
import styles from "./hanging-bulb-theme-toggle.module.css";

export function HangingBulbThemeToggle() {
  const { theme, toggleTheme, mounted } = useTheme();
  const [pull, setPull] = useState(false);
  const isDark = theme === "dark";
  const lit = !isDark;

  useEffect(() => {
    if (!pull) return;
    const t = window.setTimeout(() => setPull(false), 220);
    return () => window.clearTimeout(t);
  }, [pull]);

  if (!mounted) return null;

  const onToggle = () => {
    setPull(true);
    toggleTheme();
  };

  return (
    <div
      className={`${styles.wrap} ${pull ? styles.wrapPull : ""}`}
      aria-live="polite"
    >
      <button
        type="button"
        className={styles.btn}
        onClick={onToggle}
        aria-label={isDark ? "Bật sáng (chế độ sáng)" : "Tắt đèn (chế độ tối)"}
        aria-pressed={!isDark}
        title={isDark ? "Bật sáng" : "Chế độ tối"}
      >
        <svg
          className={styles.svg}
          viewBox="0 0 64 106"
          aria-hidden
          role="img"
        >
          <line
            className={styles.cordLine}
            x1="32"
            y1="0"
            x2="32"
            y2="64"
            vectorEffect="non-scaling-stroke"
          />
          <ellipse
            className={`${styles.glow} ${lit ? styles.glowOn : ""}`}
            cx="32"
            cy="82"
            rx="24"
            ry="22"
            fill="url(#bulbGlow)"
          />
          <rect
            className={styles.socket}
            x="26"
            y="64"
            width="12"
            height="7"
            rx="0.5"
          />
          <line
            className={styles.socketLines}
            x1="28"
            y1="67"
            x2="36"
            y2="67"
          />
          <line
            className={styles.socketLines}
            x1="28"
            y1="69"
            x2="36"
            y2="69"
          />
          <path
            className={`${styles.glass} ${lit ? styles.glassOn : ""}`}
            d="M32 71 C20 71 16 85 16 93 C16 101 23 104 32 104 C41 104 48 101 48 93 C48 85 44 71 32 71 Z"
          />
          <path
            className={`${styles.filament} ${lit ? styles.filamentOn : ""}`}
            d="M28 83 V91 M36 83 V91 M28 91 Q32 95 36 91"
          />
          <defs>
            <radialGradient id="bulbGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgb(254 240 138)" stopOpacity="0.9" />
              <stop offset="100%" stopColor="rgb(254 240 138)" stopOpacity="0" />
            </radialGradient>
          </defs>
        </svg>
      </button>
    </div>
  );
}
