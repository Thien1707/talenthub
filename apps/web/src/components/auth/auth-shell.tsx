import { TalentHubLogo } from "@/components/ui/talenthub-logo";
import { AuthBrandPanel } from "./auth-brand-panel";
import styles from "./auth-shell.module.css";

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.page}>
      <div className={styles.formSide}>
        <header className={styles.top}>
          <TalentHubLogo />
        </header>
        <main id="main" tabIndex={-1} className={styles.main}>
          <div className={styles.card}>{children}</div>
        </main>
      </div>
      <AuthBrandPanel />
    </div>
  );
}
