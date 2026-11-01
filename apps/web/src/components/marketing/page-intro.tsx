import type { ReactNode } from "react";
import styles from "./page-intro.module.css";

export function PageIntroAccent({ children }: { children: ReactNode }) {
  return (
    <em className={styles.accent}>
      {children}
      <svg viewBox="0 0 200 18" preserveAspectRatio="none" aria-hidden="true">
        <path d="M4 12 C 50 4, 110 4, 196 10" />
      </svg>
    </em>
  );
}

export function MarketingPageIntro({
  eyebrow,
  title,
  lead,
  bubble,
}: {
  eyebrow: string;
  title: ReactNode;
  lead: string;
  bubble: string;
}) {
  return (
    <header className={styles.intro}>
      <div className={styles.copy}>
        <p className={styles.eyebrow}>{eyebrow}</p>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.lead}>{lead}</p>
      </div>
      <div className={styles.stage} aria-hidden="true">
        <svg className={styles.sparkle} width="40" height="40" viewBox="0 0 44 44">
          <path d="M22 4 C 23 16, 28 21, 40 22 C 28 23, 23 28, 22 40 C 21 28, 16 23, 4 22 C 16 21, 21 16, 22 4 Z" />
        </svg>
        <svg className={styles.heart} width="36" height="32" viewBox="0 0 46 40">
          <path d="M23 36 C 8 26, 3 18, 6 11 C 9 4, 19 4, 23 12 C 27 4, 37 4, 40 11 C 43 18, 38 26, 23 36 Z" />
        </svg>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className={styles.bunny}
          src="/bunny-sticker.webp"
          alt=""
          width={523}
          height={713}
          draggable={false}
        />
        <span className={styles.ground} />
        <span className={styles.bubble}>{bubble}</span>
      </div>
    </header>
  );
}
