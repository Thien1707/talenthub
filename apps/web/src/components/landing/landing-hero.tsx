import { Sparkles } from "lucide-react";
import { HomeHeroActions } from "@/components/home-hero-actions";
import { LandingDoodles } from "./doodles";
import { LandingHeroCards } from "./hero-cards";
import styles from "./landing-hero.module.css";

const PERKS = ["CV & AI hỗ trợ", "Duyệt tin minh bạch", "Chat realtime"];

export function LandingHero() {
  return (
    <div className={styles.page}>
      {/* 1–2. Thỏ Doory → nội dung VN */}
      <section className={styles.heroUpper} aria-labelledby="hero-title">
        <LandingDoodles />
        <div className={styles.stage}>
          <span className={styles.hearts} aria-hidden="true">
            <span>♥</span>
            <span>♥</span>
          </span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className={styles.bunny}
            src="/bunny-sticker.webp"
            alt=""
            width={523}
            height={713}
            draggable={false}
          />
          <span className={styles.ground} aria-hidden="true" />
          <span className={styles.bubble} aria-hidden="true">
            Chào bạn!
          </span>
        </div>

        <div className={styles.copyBlock}>
          <div className={styles.badge}>
            <Sparkles className="h-4 w-4 shrink-0" aria-hidden />
            Nền tảng tuyển dụng cho sinh viên &amp; doanh nghiệp
          </div>

          <h1 id="hero-title" className={styles.titleCenter}>
            Việc làm{" "}
            <em className={styles.accent}>
              phù hợp
              <svg viewBox="0 0 200 18" preserveAspectRatio="none" aria-hidden="true">
                <path d="M4 12 C 50 4, 110 4, 196 10" />
              </svg>
            </em>
            ,
            <span className={styles.titleAccent}>kết nối đúng người.</span>
          </h1>

          <p className={styles.leadCenter}>
            Tìm việc full-time, tạo CV, ứng tuyển và chat trực tiếp với nhà tuyển dụng.
            Doanh nghiệp đăng tin, duyệt ứng viên và thanh toán dịch vụ an toàn qua VNPAY.
          </p>
        </div>
      </section>

      {/* 3. Ảnh fan Doory */}
      <LandingHeroCards />

      {/* 4. CTA + perks */}
      <section className={styles.lowerPanel}>
        <div className={styles.glowLeft} aria-hidden />
        <div className={styles.glowRight} aria-hidden />

        <div className={styles.actionsWrap}>
          <HomeHeroActions />
        </div>

        <ul className={styles.perks}>
          {PERKS.map((perk) => (
            <li key={perk}>{perk}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
