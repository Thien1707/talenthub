import Link from "next/link";
import styles from "./company-profile-form.module.css";

export type PublicCompanyProfile = {
  companyName: string;
  industry?: string | null;
  companySize?: string | null;
  website?: string | null;
  description?: string | null;
  address?: string | null;
  city?: string | null;
  verificationStatus?: string | null;
  logoAsset?: { secureUrl: string } | null;
};

function previewLine(parts: (string | undefined | null)[]) {
  return parts.filter((p) => p && String(p).trim()).join(" · ");
}

function normalizeWebsite(url: string) {
  const t = url.trim();
  if (!t) return t;
  if (/^https?:\/\//i.test(t)) return t;
  return `https://${t}`;
}

export function CompanyPublicProfile({ company }: { company: PublicCompanyProfile }) {
  const metaLine = previewLine([
    company.website?.trim(),
    company.city?.trim(),
    company.address?.trim(),
  ]);
  const subLine = previewLine([company.industry, company.companySize]);
  const verified = company.verificationStatus === "VERIFIED";

  const details: { label: string; value: string | null | undefined }[] = [
    { label: "Lĩnh vực", value: company.industry },
    { label: "Quy mô", value: company.companySize },
    { label: "Tỉnh / Thành", value: company.city },
    { label: "Địa chỉ", value: company.address },
  ].filter((d) => d.value && String(d.value).trim());

  return (
    <div className={styles.workspace}>
      <header className={styles.hero}>
        <p className={styles.heroEyebrow}>TalentHub · Doanh nghiệp</p>
        <h1 className={styles.heroTitle}>
          Hồ sơ{" "}
          <span className={styles.heroAccent}>công ty</span>
        </h1>
        <p className={styles.heroLead}>
          Thông tin nhà tuyển dụng hiển thị cùng{" "}
          <span className={styles.heroAccent}>tin việc làm</span>.
        </p>
      </header>

      <div className={styles.desk}>
        <article className={styles.sheet}>
          <span className={styles.sheetDim} aria-hidden>
            A4 · 210×297
          </span>

          <div className={styles.docHeader}>
            <div className={styles.logoWrap}>
              {company.logoAsset?.secureUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={company.logoAsset.secureUrl}
                  alt=""
                  className={styles.logoImg}
                />
              ) : (
                <div className={styles.logoPlaceholder}>Logo</div>
              )}
            </div>
            <h2 className={styles.docName}>{company.companyName}</h2>
            {subLine ? (
              <p className={styles.docSub}>{subLine}</p>
            ) : null}
            {metaLine ? (
              <p className={styles.docMeta}>{metaLine}</p>
            ) : null}
            {verified ? (
              <span className={styles.verifiedBadge}>Đã xác minh</span>
            ) : null}
          </div>

          {company.website?.trim() ? (
            <section className={styles.section} aria-labelledby="pub-web">
              <h3 id="pub-web" className={styles.sectionLabel}>
                Website
              </h3>
              <a
                href={normalizeWebsite(company.website)}
                target="_blank"
                rel="noreferrer"
                className={styles.websiteLink}
              >
                {company.website.trim()}
              </a>
            </section>
          ) : null}

          {details.length > 0 ? (
            <section className={styles.section} aria-labelledby="pub-info">
              <h3 id="pub-info" className={styles.sectionLabel}>
                Thông tin chung
              </h3>
              <dl className={styles.detailGrid}>
                {details.map((row) => (
                  <div key={row.label} className={styles.detailRow}>
                    <dt className={styles.detailLabel}>{row.label}</dt>
                    <dd className={styles.detailValue}>{row.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ) : null}

          <section className={styles.section} aria-labelledby="pub-about">
            <h3 id="pub-about" className={styles.sectionLabel}>
              Giới thiệu
            </h3>
            {company.description?.trim() ? (
              <p className={styles.bodyText}>{company.description.trim()}</p>
            ) : (
              <p className={styles.emptyHint}>
                Công ty chưa thêm phần giới thiệu.
              </p>
            )}
          </section>
        </article>
      </div>

      <Link href="/viec-lam" className={styles.backLink}>
        ← Quay lại việc làm
      </Link>
    </div>
  );
}
