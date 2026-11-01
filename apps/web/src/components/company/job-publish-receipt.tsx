import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./job-publish-receipt.module.css";

export type ReceiptLine = {
  label: string;
  value: string;
  muted?: boolean;
};

type JobPublishReceiptProps = {
  dateLabel: string;
  lines: ReceiptLine[];
  afterTotalLines?: ReceiptLine[];
  totalLabel?: string;
  totalValue: string;
  note?: ReactNode;
  showTopUp?: boolean;
  backHref?: string;
  backLabel?: string;
  footer?: ReactNode;
  /** Đổi giá trị để chạy lại hiệu ứng giấy in từ khe máy in. */
  printSignature?: string;
};

export function JobPublishReceipt({
  dateLabel,
  lines,
  afterTotalLines = [],
  totalLabel = "Tổng",
  totalValue,
  note,
  showTopUp,
  backHref = "/cong-ty/tin-tuyen-dung/tao",
  backLabel = "Quay lại chỉnh sửa",
  footer,
  printSignature = "print",
}: JobPublishReceiptProps) {
  return (
    <div className={styles.wrap}>
      <div className={styles.housing} key={printSignature}>
        <div
          className={`${styles.slot} ${styles.slotBuzz}`}
          aria-hidden
        />
        <div className={styles.outlet}>
          <article
            className={`${styles.paper} ${styles.paperPrint}`}
            aria-label="Hóa đơn thanh toán đăng tin"
          >
        <p className={styles.brand}>TALENTHUB</p>
        <p className={styles.tagline}>Thanh toán đăng tin tuyển dụng</p>
        <p className={styles.date}>{dateLabel}</p>

        <hr className={styles.ruleDashed} />

        <div className={styles.lines}>
          {lines.map((row) => (
            <div
              key={`${row.label}-${row.value}`}
              className={`${styles.line} ${row.muted ? styles.lineMuted : ""}`}
            >
              <span className={styles.lineLabel}>{row.label}</span>
              <span className={styles.lineValue}>{row.value}</span>
            </div>
          ))}
        </div>

        <hr className={styles.ruleSolid} />

        <div className={styles.totalRow}>
          <span>{totalLabel}</span>
          <span>{totalValue}</span>
        </div>

        {afterTotalLines.length > 0 ? (
          <>
            <hr className={styles.ruleDashed} />
            <div className={styles.lines}>
              {afterTotalLines.map((row) => (
                <div
                  key={`${row.label}-${row.value}`}
                  className={`${styles.line} ${row.muted ? styles.lineMuted : ""}`}
                >
                  <span className={styles.lineLabel}>{row.label}</span>
                  <span className={styles.lineValue}>{row.value}</span>
                </div>
              ))}
            </div>
          </>
        ) : null}

        <hr className={styles.ruleDashed} />

        {note ? <div className={styles.note}>{note}</div> : null}

        {showTopUp ? (
          <div className={styles.actions}>
            <Link href="/cong-ty/vi-tien" className={styles.btnPrimary}>
              Nạp ví
              <ArrowUpRight className="h-3 w-3" aria-hidden />
            </Link>
            <Link href={backHref} className={styles.btnSecondary}>
              {backLabel}
              <ArrowUpRight className="h-3 w-3" aria-hidden />
            </Link>
          </div>
        ) : null}

        {footer ? <div className={styles.footerActions}>{footer}</div> : null}

        <div className={styles.barcode} aria-hidden />
          </article>
        </div>
      </div>
    </div>
  );
}
