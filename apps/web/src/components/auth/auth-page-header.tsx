import type { ReactNode } from "react";
import styles from "./auth-page.module.css";

export function AuthPageHeader({
  title,
  lead,
}: {
  title: string;
  lead: string;
}) {
  return (
    <header className={styles.header}>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.lead}>{lead}</p>
    </header>
  );
}

export function AuthPageFooter({ children }: { children: ReactNode }) {
  return <p className={styles.footer}>{children}</p>;
}
