"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, Loader2, Search, X } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  MarketingPageIntro,
  PageIntroAccent,
} from "@/components/marketing/page-intro";
import { api } from "@/lib/api/client";
import { formatSalaryRange } from "@/lib/format-money";
import styles from "./public-jobs-list.module.css";

type JobItem = {
  jobId: string;
  title: string;
  slug: string;
  location: string;
  jobType: string;
  highlightUntil?: string | null;
  featuredUntil?: string | null;
  promotionTopUntil?: string | null;
  salaryMin?: string | null;
  salaryMax?: string | null;
  company?: { companyName: string; city?: string | null };
  category?: { categoryName?: string };
};

type JobsResponse = {
  items: JobItem[];
  total: number;
  page: number;
  limit: number;
};

const TONES = ["pink", "butter", "mint"] as const;

function promoActive(until?: string | null) {
  if (!until) return false;
  return new Date(until) > new Date();
}

const PAGE_SIZE = 20;

export function PublicJobsList() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const keywordFromUrl = searchParams.get("keyword") ?? searchParams.get("q") ?? "";
  const pageFromUrl = Math.max(1, Number(searchParams.get("page") || "1") || 1);

  const [keyword, setKeyword] = useState(keywordFromUrl);
  const [appliedKeyword, setAppliedKeyword] = useState(keywordFromUrl);
  const [page, setPage] = useState(pageFromUrl);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const suggestRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setKeyword(keywordFromUrl);
    setAppliedKeyword(keywordFromUrl);
    setPage(pageFromUrl);
  }, [keywordFromUrl, pageFromUrl]);

  const pushSearchState = useCallback(
    (nextKeyword: string, nextPage: number) => {
      const params = new URLSearchParams();
      const trimmed = nextKeyword.trim();
      if (trimmed) params.set("keyword", trimmed);
      if (nextPage > 1) params.set("page", String(nextPage));
      const qs = params.toString();
      router.replace(qs ? `/viec-lam?${qs}` : "/viec-lam", { scroll: false });
    },
    [router],
  );

  const submitSearch = useCallback(
    (value?: string) => {
      const next = (value ?? keyword).trim();
      setAppliedKeyword(next);
      setPage(1);
      setSuggestOpen(false);
      pushSearchState(next, 1);
    },
    [keyword, pushSearchState],
  );

  const { data, isLoading, isFetching, isError } = useQuery({
    queryKey: ["jobs", "public", appliedKeyword, page],
    queryFn: async () => {
      const { data: res } = await api.get<JobsResponse>("/jobs", {
        params: {
          keyword: appliedKeyword || undefined,
          page,
          limit: PAGE_SIZE,
        },
      });
      return res;
    },
    placeholderData: (prev) => prev,
  });

  const { data: suggestions } = useQuery({
    queryKey: ["jobs", "search-suggestions", keyword],
    enabled: suggestOpen && keyword.trim().length >= 2,
    queryFn: async () => {
      const { data: res } = await api.get<{
        titles: string[];
        categories: { categoryId: string; name: string }[];
      }>("/jobs/search-suggestions", {
        params: { q: keyword.trim(), limit: 8 },
      });
      return res;
    },
    staleTime: 30_000,
  });

  const totalPages = useMemo(() => {
    if (!data?.total) return 1;
    return Math.max(1, Math.ceil(data.total / (data.limit || PAGE_SIZE)));
  }, [data]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!suggestRef.current?.contains(e.target as Node)) {
        setSuggestOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const clearSearch = () => {
    setKeyword("");
    setAppliedKeyword("");
    setPage(1);
    pushSearchState("", 1);
  };

  const goPage = (p: number) => {
    const next = Math.min(Math.max(1, p), totalPages);
    setPage(next);
    pushSearchState(appliedKeyword, next);
  };

  const hasSuggestions =
    (suggestions?.titles.length ?? 0) > 0 ||
    (suggestions?.categories.length ?? 0) > 0;

  return (
    <div className={styles.page}>
      <MarketingPageIntro
        eyebrow="tìm việc"
        title={
          <>
            Tìm cơ hội <PageIntroAccent>phù hợp</PageIntroAccent> với bạn.
          </>
        }
        lead="Tin tuyển dụng full-time từ doanh nghiệp đã kiểm duyệt trên TalentHub — tìm kiếm, lưu tin và ứng tuyển ngay."
        bubble="chào bạn!"
      />

      <section className={styles.searchNote} aria-labelledby="jobs-search-title">
        <div className={styles.searchHead}>
          <p className={styles.hand}>hoặc gõ từ khóa</p>
          <h2 id="jobs-search-title" className={styles.searchTitle}>
            Tìm kiếm việc làm
          </h2>
          <p className={styles.searchLead}>
            Vị trí, ngành nghề, tên công ty — gợi ý hiện khi bạn gõ từ 2 ký tự trở lên.
          </p>
        </div>

        <div ref={suggestRef} className={styles.searchFormWrap}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submitSearch();
            }}
          >
            <label className={styles.fieldLabel} htmlFor="jobs-keyword">
              Từ khóa
            </label>
            <div className={styles.searchRow}>
              <div className={styles.inputWrap}>
                <Search className="h-4 w-4 shrink-0 text-slate-500" aria-hidden />
                <input
                  id="jobs-keyword"
                  value={keyword}
                  onChange={(e) => {
                    setKeyword(e.target.value);
                    setSuggestOpen(true);
                  }}
                  onFocus={() => keyword.trim().length >= 2 && setSuggestOpen(true)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") setSuggestOpen(false);
                  }}
                  placeholder="VD: Frontend, Kế toán, Marketing…"
                  className={styles.input}
                  autoComplete="off"
                />
                {keyword ? (
                  <button
                    type="button"
                    className={styles.clearBtn}
                    aria-label="Xóa từ khóa"
                    onClick={() => clearSearch()}
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
              <button
                type="submit"
                className={`button button-primary ${styles.submitBtn}`}
                disabled={isFetching && !data}
              >
                Tìm việc
              </button>
            </div>
          </form>

          {suggestOpen && keyword.trim().length >= 2 && hasSuggestions ? (
            <ul className={styles.suggestList}>
              {suggestions?.categories.map((c) => (
                <li key={c.categoryId}>
                  <button
                    type="button"
                    className={styles.suggestItem}
                    onClick={() => submitSearch(c.name)}
                  >
                    <span className="text-xs font-bold text-violet-600">Ngành · </span>
                    {c.name}
                  </button>
                </li>
              ))}
              {suggestions?.titles.map((title) => (
                <li key={title}>
                  <button
                    type="button"
                    className={styles.suggestItem}
                    onClick={() => submitSearch(title)}
                  >
                    {title}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </section>

      {appliedKeyword ? (
        <p className={styles.meta}>
          Kết quả cho &quot;<strong>{appliedKeyword}</strong>&quot;
          {data != null && (
            <>
              {" "}
              · <strong>{data.total}</strong> việc làm
            </>
          )}
          {" · "}
          <button type="button" className="text-link" onClick={clearSearch}>
            Xóa tìm kiếm
          </button>
        </p>
      ) : data != null ? (
        <p className={styles.meta}>
          <strong>{data.total}</strong> tin tuyển dụng đang mở
        </p>
      ) : null}

      {isLoading && !data && (
        <p className={styles.loading}>
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          Đang tải tin tuyển dụng…
        </p>
      )}
      {isError && (
        <p className={styles.error}>
          Không tải được danh sách. Kiểm tra API và NEXT_PUBLIC_API_URL.
        </p>
      )}

      {isFetching && data ? (
        <p className={styles.loading}>
          <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
          Đang cập nhật…
        </p>
      ) : null}

      {!isLoading && !isError && data?.items.length === 0 && (
        <div className={styles.empty}>
          <p className="font-bold text-slate-800">
            {appliedKeyword
              ? "Không tìm thấy việc làm phù hợp với từ khóa của bạn."
              : "Chưa có tin tuyển dụng công khai."}
          </p>
          {appliedKeyword ? (
            <p className="mt-2 text-sm font-medium text-slate-600">
              Thử từ khóa khác (vd: IT, Frontend, Kế toán, Marketing).
            </p>
          ) : null}
        </div>
      )}

      <ul className={styles.ways}>
        {data?.items.map((job, index) => {
          const tone = TONES[index % TONES.length]!;
          const promos: string[] = [];
          if (job.jobType === "VIP") promos.push("VIP");
          if (promoActive(job.highlightUntil)) promos.push("Nổi bật");
          if (promoActive(job.promotionTopUntil)) promos.push("Top");
          if (promoActive(job.featuredUntil)) promos.push("Featured");

          const company = job.company?.companyName ?? "Doanh nghiệp";
          const initial = company.charAt(0).toUpperCase();

          return (
            <li key={job.jobId} className={styles.way} data-tone={tone}>
              <span className={styles.icon} aria-hidden>
                {initial}
              </span>
              <h3 className={styles.wayTitle}>
                <Link href={`/viec-lam/${job.slug}`}>{job.title}</Link>
              </h3>
              <p className={styles.wayText}>
                <strong>{company}</strong>
                {job.category?.categoryName ? ` · ${job.category.categoryName}` : ""}
                <br />
                {job.location}
                {job.company?.city ? ` · ${job.company.city}` : ""}
                <br />
                <span className="text-violet-700">{formatSalaryRange(job.salaryMin, job.salaryMax)}</span>
                {" · "}
                {job.jobType}
              </p>
              {promos.length > 0 ? (
                <div className={styles.wayMeta}>
                  {promos.map((p) => (
                    <span key={p} className={styles.promoTag}>
                      {p}
                    </span>
                  ))}
                </div>
              ) : null}
              <Link href={`/viec-lam/${job.slug}`} className={styles.wayAction}>
                Xem chi tiết
                <ArrowUpRight className="h-4 w-4" aria-hidden />
              </Link>
            </li>
          );
        })}
      </ul>

      {data && totalPages > 1 ? (
        <nav className={styles.pagination} aria-label="Phân trang">
          <button
            type="button"
            className={styles.pageBtn}
            disabled={page <= 1 || isFetching}
            onClick={() => goPage(page - 1)}
          >
            Trước
          </button>
          <span className={styles.pageInfo}>
            Trang {page} / {totalPages}
          </span>
          <button
            type="button"
            className={styles.pageBtn}
            disabled={page >= totalPages || isFetching}
            onClick={() => goPage(page + 1)}
          >
            Sau
          </button>
        </nav>
      ) : null}
    </div>
  );
}
