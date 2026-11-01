import styles from "./auth-brand-panel.module.css";

export function AuthBrandPanel() {
  return (
    <aside className={styles.panel} aria-label="Giới thiệu TalentHub">
      <div className={styles.scene} aria-hidden="true">
        <div className={styles.card}>
          <span className={styles.cardHand}>một lời chào</span>
          <span className={styles.cardTitle}>
            Xin chào,
            <br />
            <em>bạn</em>
          </span>
          <span className={styles.cardDots}>
            <span />
            <span />
            <span />
          </span>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className={styles.bunny}
          src="/bunny-sticker.webp"
          alt=""
          width={523}
          height={713}
          draggable={false}
        />
        <span className={styles.bubble}>chào mừng!</span>
        <svg className={styles.sparkle} width="44" height="44" viewBox="0 0 44 44">
          <path d="M22 4 C 23 16, 28 21, 40 22 C 28 23, 23 28, 22 40 C 21 28, 16 23, 4 22 C 16 21, 21 16, 22 4 Z" />
        </svg>
        <svg className={styles.heart} width="40" height="36" viewBox="0 0 46 40">
          <path d="M23 36 C 8 26, 3 18, 6 11 C 9 4, 19 4, 23 12 C 27 4, 37 4, 40 11 C 43 18, 38 26, 23 36 Z" />
        </svg>
      </div>
      <div className={styles.copy}>
        <h2 className={styles.headline}>
          Tự tin ứng tuyển, tự hào CV của bạn.
        </h2>
      </div>
    </aside>
  );
}
