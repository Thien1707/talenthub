import Link from "next/link";
import styles from "./hero-cards.module.css";

const CARDS = [
  {
    href: "/viec-lam",
    src: "/landing/bold-sale-announcement.webp",
    caption: "a sale post",
    label: "Việc làm nổi bật",
    place: styles.left,
    width: 17.5,
    aspect: 1,
  },
  {
    href: "/sinh-vien/cv",
    src: "/landing/rooftop-event-story.webp",
    caption: "a story",
    label: "Tạo CV",
    place: styles.middle,
    width: 15,
    aspect: 1080 / 1920,
  },
  {
    href: "/viec-lam",
    src: "/landing/night-bloom-concert-poster.webp",
    caption: "a poster",
    label: "Tin tuyển dụng",
    place: styles.right,
    width: 16.25,
    aspect: 1728 / 2304,
  },
] as const;

export function LandingHeroCards() {
  return (
    <div className={styles.fan}>
      <ul className={styles.art}>
        {CARDS.map((card) => (
          <li
            key={card.src}
            className={card.place}
            style={{
              width: `${card.width}rem`,
              height: `${card.width / card.aspect}rem`,
              marginLeft: `${-card.width / 2}rem`,
            }}
          >
            <Link href={card.href} className={styles.link} aria-label={card.label}>
              <span className={styles.card}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className={styles.picture}
                  src={card.src}
                  alt=""
                  width={Math.round(960 * card.aspect)}
                  height={960}
                  loading="eager"
                  decoding="async"
                />
              </span>
              <span className={styles.caption} aria-hidden="true">
                {card.caption}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
