"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { toast } from "sonner";
import { JobApplicantsPanel } from "@/components/company/job-applicants-panel";
import { api } from "@/lib/api/client";
import { formatVND, parseVndAmount } from "@/lib/format-money";
import { jobStatusBadgeClass, jobStatusLabel } from "@/lib/job-status";
import styles from "./company-jobs-panel.module.css";

type JobRow = {
  jobId: string;
  title: string;
  status: string;
  jobType: string;
  slug: string;
  isPaid: boolean;
};

type TabId = "all" | "draft" | "pending" | "live" | "other";

const TABS: { id: TabId; label: string }[] = [
  { id: "all", label: "Tất cả" },
  { id: "draft", label: "Nháp" },
  { id: "pending", label: "Chờ duyệt" },
  { id: "live", label: "Đang tuyển" },
  { id: "other", label: "Khác" },
];

function tabFilter(tab: TabId, status: string) {
  switch (tab) {
    case "draft":
      return status === "DRAFT" || status === "REJECTED";
    case "pending":
      return status === "PENDING";
    case "live":
      return status === "APPROVED" || status === "PAUSED";
    case "other":
      return status === "CLOSED" || status === "EXPIRED" || status === "REMOVED";
    default:
      return true;
  }
}

function countByTab(jobs: JobRow[], tab: TabId) {
  return jobs.filter((j) => tabFilter(tab, j.status)).length;
}

export function CompanyJobsPanel() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<TabId>("all");

  const { data, isLoading } = useQuery({
    queryKey: ["jobs", "company"],
    queryFn: async () => {
      const { data } = await api.get<{ items: JobRow[] }>("/jobs/company/mine");
      return data.items;
    },
  });

  const { data: profile } = useQuery({
    queryKey: ["company", "profile"],
    queryFn: async () => {
      const { data } = await api.get<{
        postingQuota?: {
          freePostLimit: number;
          freePostUsed: number;
          paidPostCount: number;
        } | null;
      }>("/companies/me/profile");
      return data;
    },
  });

  const { data: wallet } = useQuery({
    queryKey: ["wallet", "me"],
    queryFn: async () => {
      const { data } = await api.get<{ balanceVnd: string }>("/wallet/me");
      return data;
    },
  });

  const jobs = data ?? [];

  const filtered = useMemo(
    () => jobs.filter((j) => tabFilter(tab, j.status)),
    [jobs, tab],
  );

  const stats = useMemo(() => {
    const draft = countByTab(jobs, "draft");
    const pending = countByTab(jobs, "pending");
    const live = countByTab(jobs, "live");
    const total = jobs.length || 1;
    const liveDeg = (live / total) * 360;
    const pendingDeg = (pending / total) * 360;
    const livePct = (live / total) * 100;
    return { draft, pending, live, liveDeg, pendingDeg, livePct };
  }, [jobs]);

  const invalidateJobs = () => {
    void qc.invalidateQueries({ queryKey: ["jobs", "company"] });
    void qc.invalidateQueries({ queryKey: ["jobs", "public"] });
  };

  const apiMessage = (err: unknown) =>
    (err as { response?: { data?: { message?: string } } })?.response?.data
      ?.message;

  const pauseJob = useMutation({
    mutationFn: (jobId: string) => api.post(`/jobs/company/${jobId}/pause`),
    onSuccess: () => {
      toast.success("Tin đã chuyển sang Tạm dừng");
      invalidateJobs();
    },
    onError: (err) => toast.error(apiMessage(err) ?? "Tạm dừng thất bại"),
  });

  const resumeJob = useMutation({
    mutationFn: (jobId: string) => api.post(`/jobs/company/${jobId}/resume`),
    onSuccess: () => {
      toast.success("Tin đã hiển thị lại");
      invalidateJobs();
    },
    onError: (err) => toast.error(apiMessage(err) ?? "Tiếp tục tin thất bại"),
  });

  const closeJob = useMutation({
    mutationFn: (jobId: string) => api.post(`/jobs/company/${jobId}/close`),
    onSuccess: () => {
      toast.success("Tin đã đóng");
      invalidateJobs();
    },
    onError: (err) => toast.error(apiMessage(err) ?? "Đóng tin thất bại"),
  });

  const balance = parseVndAmount(wallet?.balanceVnd) ?? 0;
  const quota = profile?.postingQuota;

  const ringGradient =
    jobs.length === 0
      ? "conic-gradient(#e7e5e4 0 360deg)"
      : `conic-gradient(#1b5e40 0 ${stats.liveDeg}deg, #ca8a04 ${stats.liveDeg}deg ${stats.liveDeg + stats.pendingDeg}deg, #a8a29e ${stats.liveDeg + stats.pendingDeg}deg 360deg)`;

  return (
    <div className={styles.workspace}>
      <div className={styles.layout}>
        <aside className={styles.rail}>
          <h1 className={styles.railTitle}>Tuyển dụng.</h1>
          <p className={styles.railLead}>
            Tạo tin nháp, gửi duyệt, thanh toán và quản lý ứng viên — theo từng
            bước rõ ràng.
          </p>

          <div className={styles.ringWrap}>
            <div
              className={styles.ringDonut}
              style={{
                background: ringGradient,
                WebkitMask:
                  "radial-gradient(circle, transparent 58%, #000 59%)",
                mask: "radial-gradient(circle, transparent 58%, #000 59%)",
              }}
              aria-hidden
            />
            <div className={styles.ringCenter}>
              <span className={styles.ringCount}>{jobs.length}</span>
              <span className={styles.ringLabel}>Tin tuyển dụng</span>
            </div>
          </div>

          <div className={styles.legend}>
            <span className={styles.legendItem}>
              <span
                className={styles.legendDot}
                style={{ background: "#1b5e40" }}
              />
              Đang tuyển {stats.live}
            </span>
            <span className={styles.legendItem}>
              <span
                className={styles.legendDot}
                style={{ background: "#ca8a04" }}
              />
              Chờ duyệt {stats.pending}
            </span>
            <span className={styles.legendItem}>
              <span
                className={styles.legendDot}
                style={{ background: "#a8a29e" }}
              />
              Nháp {stats.draft}
            </span>
          </div>

          <p className={styles.quotaBox}>
            3 tin thường đầu miễn phí — từ tin thứ 4 tính phí theo bảng giá
            admin. Thanh toán qua ví.
            {quota ? (
              <>
                <br />
                Miễn phí: {quota.freePostUsed}/{quota.freePostLimit} · Trả phí:{" "}
                {quota.paidPostCount}
              </>
            ) : null}
          </p>

          <div className={styles.walletRow}>
            <Link href="/cong-ty/vi-tien" className={styles.walletLink}>
              Ví đăng tin →
            </Link>
            <span className={styles.walletBalance}>{formatVND(balance)}</span>
          </div>

          <Link href="/cong-ty/tin-tuyen-dung/tao" className={styles.createBtn}>
            + Tạo tin
          </Link>
        </aside>

        <div className={styles.stack}>
          <div className={styles.tabRow} role="tablist" aria-label="Lọc tin">
            {TABS.map((t) => {
              const n = countByTab(jobs, t.id);
              return (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={tab === t.id}
                  className={`${styles.tab} ${tab === t.id ? styles.tabActive : ""}`}
                  onClick={() => setTab(t.id)}
                >
                  {t.label}
                  {n > 0 && t.id !== "all" ? (
                    <span className={styles.tabBadge}>{n}</span>
                  ) : null}
                </button>
              );
            })}
          </div>

          <div className={styles.folder}>
            <div className={styles.paper}>
              <div className={styles.paperHead}>
                <h2 className={styles.paperTitle}>Tin của công ty</h2>
                <p className={styles.paperSub}>
                  {tab === "all"
                    ? "Toàn bộ tin — chọn tab để lọc theo trạng thái."
                    : `Đang xem: ${TABS.find((x) => x.id === tab)?.label ?? ""}`}
                </p>
                <div className={styles.progressTrack}>
                  <div
                    className={styles.progressFill}
                    style={{ width: `${stats.livePct}%` }}
                  />
                </div>
              </div>

              {isLoading ? (
                <p className={styles.loading}>Đang tải tin…</p>
              ) : filtered.length === 0 ? (
                <p className={styles.emptyPaper}>
                  Không có tin trong mục này.{" "}
                  <Link href="/cong-ty/tin-tuyen-dung/tao" className={styles.walletLink}>
                    Tạo tin mới
                  </Link>
                </p>
              ) : (
                <ul className={styles.jobList}>
                  {filtered.map((job) => (
                    <li key={job.jobId} className={styles.jobRow}>
                      <span
                        className={`${styles.statusMark} ${
                          job.status === "APPROVED" ? styles.statusMarkLive : ""
                        }`}
                        aria-hidden
                      />
                      <div className={styles.jobMain}>
                        <p className={styles.jobTitle}>{job.title}</p>
                        <div className={styles.jobMeta}>
                          <span
                            className={`${styles.statusPill} ${jobStatusBadgeClass(job.status)}`}
                          >
                            {jobStatusLabel(job.status)}
                          </span>
                          <span className={styles.typeTag}>{job.jobType}</span>
                        </div>
                      </div>
                      <div className={styles.jobActions}>
                        {job.status === "APPROVED" && (
                          <Link
                            href={`/viec-lam/${job.slug}`}
                            className={`${styles.actionLink} ${styles.actionGhost}`}
                          >
                            Xem công khai
                          </Link>
                        )}
                        {(job.status === "DRAFT" ||
                          job.status === "REJECTED") && (
                          <Link
                            href={`/cong-ty/tin-tuyen-dung/${job.jobId}/dang-tin`}
                            className={`${styles.actionLink} ${styles.actionPrimary}`}
                          >
                            Thanh toán &amp; gửi duyệt
                          </Link>
                        )}
                        {job.status === "APPROVED" && (
                          <>
                            <button
                              type="button"
                              className={`${styles.actionBtn} ${styles.actionWarn}`}
                              disabled={pauseJob.isPending}
                              onClick={() => pauseJob.mutate(job.jobId)}
                            >
                              Tạm dừng
                            </button>
                            <button
                              type="button"
                              className={`${styles.actionBtn} ${styles.actionDanger}`}
                              disabled={closeJob.isPending}
                              onClick={() => closeJob.mutate(job.jobId)}
                            >
                              Đóng
                            </button>
                          </>
                        )}
                        {job.status === "PAUSED" && (
                          <>
                            <button
                              type="button"
                              className={`${styles.actionBtn} ${styles.actionPrimary}`}
                              disabled={resumeJob.isPending}
                              onClick={() => resumeJob.mutate(job.jobId)}
                            >
                              Tiếp tục
                            </button>
                            <button
                              type="button"
                              className={`${styles.actionBtn} ${styles.actionDanger}`}
                              disabled={closeJob.isPending}
                              onClick={() => closeJob.mutate(job.jobId)}
                            >
                              Đóng
                            </button>
                          </>
                        )}
                        {job.status === "CLOSED" && (
                          <span className={styles.typeTag}>Chỉ xem ứng viên</span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>

      {data && (
        <div className={styles.applicantsWrap}>
          <Suspense
            fallback={
              <p className={styles.loading}>Đang tải ứng viên…</p>
            }
          >
            <JobApplicantsPanel jobs={data} />
          </Suspense>
        </div>
      )}
    </div>
  );
}
