"use client";

import { useQuery } from "@tanstack/react-query";
import { Bookmark, Briefcase, Building2, Sparkles } from "lucide-react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import {
  MarketingPageIntro,
  PageIntroAccent,
} from "@/components/marketing/page-intro";
import { RequireAuth } from "@/components/require-auth";
import { api } from "@/lib/api/client";
import styles from "./saved-jobs-page.module.css";

const NOTE_ICONS: LucideIcon[] = [Briefcase, Bookmark, Building2, Sparkles];

export default function SavedJobsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["saved-jobs"],
    queryFn: async () => {
      const { data } = await api.get<
        Array<{
          jobId: string;
          job: { title: string; slug: string; company?: { companyName: string } };
        }>
      >("/saved-jobs");
      return data;
    },
  });

  return (
    <AppShell>
      <RequireAuth roles={["STUDENT"]}>
        <MarketingPageIntro
          eyebrow="mọi thứ gom một chỗ"
          title={
            <>
              Mọi tin yêu thích.{" "}
              <PageIntroAccent>Không</PageIntroAccent> bỏ lỡ.
            </>
          }
          lead="Lưu tin từ trang việc làm, xem lại và ứng tuyển khi bạn sẵn sàng — không giới hạn số lượng."
          bubble="lưu thoải mái!"
        />

        <section className={styles.section} aria-labelledby="saved-jobs-list">
          <h2 id="saved-jobs-list" className="sr-only">
            Việc đã lưu
          </h2>
          {isLoading && (
            <p className="text-sm font-medium text-slate-500">Đang tải…</p>
          )}
          <ul className={styles.notes}>
            {data?.map((row, index) => {
              const Icon = NOTE_ICONS[index % NOTE_ICONS.length];
              const company = row.job.company?.companyName ?? "Công ty đang cập nhật";
              return (
                <li key={row.jobId} className={styles.note}>
                  <span className={styles.icon} aria-hidden="true">
                    <Icon size={20} strokeWidth={2.25} />
                  </span>
                  <h3 className={styles.noteTitle}>
                    <Link href={`/viec-lam/${row.job.slug}`}>{row.job.title}</Link>
                  </h3>
                  <p className={styles.noteText}>{company}</p>
                  <Link
                    href={`/viec-lam/${row.job.slug}`}
                    className={`text-link ${styles.noteLink}`}
                  >
                    Xem tin & ứng tuyển
                  </Link>
                </li>
              );
            })}
            {!isLoading && data?.length === 0 && (
              <li className={styles.empty}>
                Bạn chưa lưu tin nào. Mở chi tiết việc làm và bấm{" "}
                <strong>Lưu tin</strong> để ghim vào đây.
              </li>
            )}
          </ul>
        </section>
      </RequireAuth>
    </AppShell>
  );
}
