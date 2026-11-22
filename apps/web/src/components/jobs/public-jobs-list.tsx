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
import { LocationFields } from "@/components/locations/location-fields";
import { api } from "@/lib/api/client";
import { formatSalaryRange } from "@/lib/format-money";
import styles from "./public-jobs-list.module.css";

type JobItem = {
  jobId: string;
  title: string;
  slug: string;
  location: string;
  jobType: string;
  workScheduleType?: string | null;
  province?: string | null;
  ward?: string | null;
  streetAddress?: string | null;
  detailAddress?: string | null;
  schedules?: {
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    shiftName?: string | null;
  }[];
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
const WORK_DAYS = [
  ["MONDAY", "Thứ 2"],
  ["TUESDAY", "Thứ 3"],
  ["WEDNESDAY", "Thứ 4"],
  ["THURSDAY", "Thứ 5"],
  ["FRIDAY", "Thứ 6"],
  ["SATURDAY", "Thứ 7"],
  ["SUNDAY", "Chủ nhật"],
] as const;
const WORK_DAY_LABELS = Object.fromEntries(WORK_DAYS);

type SearchFilters = {
  province: string;
  ward: string;
  jobType: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  salaryMin: string;
};

function readFilters(params: URLSearchParams): SearchFilters {
  return {
    province: params.get("province") ?? "",
    ward: params.get("ward") ?? "",
    jobType: params.get("jobType") ?? "",
    dayOfWeek: params.get("dayOfWeek") ?? "",
    startTime: params.get("startTime") ?? "",
    endTime: params.get("endTime") ?? "",
    salaryMin: params.get("salaryMin") ?? "",
  };
}

function hasActiveFilters(filters: SearchFilters) {
  return Object.values(filters).some(Boolean);
}

export function PublicJobsList() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const keywordFromUrl = searchParams.get("keyword") ?? searchParams.get("q") ?? "";
  const pageFromUrl = Math.max(1, Number(searchParams.get("page") || "1") || 1);
  const searchParamString = searchParams.toString();
  const filtersFromUrl = readFilters(new URLSearchParams(searchParamString));

  const [keyword, setKeyword] = useState(keywordFromUrl);
  const [appliedKeyword, setAppliedKeyword] = useState(keywordFromUrl);
  const [filters, setFilters] = useState(filtersFromUrl);
  const [appliedFilters, setAppliedFilters] = useState(filtersFromUrl);
  const [page, setPage] = useState(pageFromUrl);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const suggestRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(searchParamString);
    const nextKeyword = params.get("keyword") ?? params.get("q") ?? "";
    setKeyword(nextKeyword);
    setAppliedKeyword(nextKeyword);
    setFilters(readFilters(params));
    setAppliedFilters(readFilters(params));
    setPage(Math.max(1, Number(params.get("page") || "1") || 1));
  }, [searchParamString]);

  const pushSearchState = useCallback(
    (nextKeyword: string, nextPage: number, nextFilters: SearchFilters) => {
      const params = new URLSearchParams();
      const trimmed = nextKeyword.trim();
      if (trimmed) params.set("keyword", trimmed);
      if (nextPage > 1) params.set("page", String(nextPage));
      for (const [key, value] of Object.entries(nextFilters)) {
        if (value) params.set(key, value);
      }
      const qs = params.toString();
      router.replace(qs ? `/viec-lam?${qs}` : "/viec-lam", { scroll: false });
    },
    [router],
  );

  const submitSearch = useCallback(
    (value?: string) => {
      const next = (value ?? keyword).trim();
      setAppliedKeyword(next);
      setAppliedFilters(filters);
      setPage(1);
      setSuggestOpen(false);
      pushSearchState(next, 1, filters);
    },
    [filters, keyword, pushSearchState],
  );

  const { data, isLoading, isFetching, isError } = useQuery({
    queryKey: ["jobs", "public", appliedKeyword, appliedFilters, page],
    queryFn: async () => {
      const { data: res } = await api.get<JobsResponse>("/jobs", {
        params: {
          keyword: appliedKeyword || undefined,
          province: appliedFilters.province || undefined,
          ward: appliedFilters.ward || undefined,
          jobType: appliedFilters.jobType || undefined,
          dayOfWeek: appliedFilters.dayOfWeek || undefined,
          startTime: appliedFilters.startTime || undefined,
          endTime: appliedFilters.endTime || undefined,
          salaryMin: appliedFilters.salaryMin || undefined,
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
    setFilters(appliedFilters);
    setPage(1);
    pushSearchState("", 1, appliedFilters);
  };

  const goPage = (p: number) => {
    const next = Math.min(Math.max(1, p), totalPages);
    setPage(next);
    pushSearchState(appliedKeyword, next, appliedFilters);
  };

  const clearAllFilters = () => {
    const emptyFilters: SearchFilters = {
      province: "",
      ward: "",
      jobType: "",
      dayOfWeek: "",
      startTime: "",
      endTime: "",
      salaryMin: "",
    };
    setKeyword("");
    setAppliedKeyword("");
    setFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
    setPage(1);
    pushSearchState("", 1, emptyFilters);
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
        lead="Tìm việc theo địa điểm, loại hình và thời gian bạn có thể làm — lưu tin và ứng tuyển ngay."
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

          <form
            className={styles.filterForm}
            onSubmit={(event) => {
              event.preventDefault();
              setAppliedFilters(filters);
              setPage(1);
              pushSearchState(appliedKeyword, 1, filters);
            }}
          >
            <h3 className={styles.filterTitle}>Lọc công việc</h3>
            <div className={styles.filterGrid}>
              <LocationFields
                province={filters.province}
                ward={filters.ward}
                className={styles.locationFields}
                onChange={(location) =>
                  setFilters((current) => ({ ...current, ...location }))
                }
              />
              <label className={styles.filterField}>
                <span>Loại hình</span>
                <select
                  value={filters.jobType}
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      jobType: event.target.value,
                      dayOfWeek:
                        event.target.value === "PART_TIME"
                          ? current.dayOfWeek
                          : "",
                      startTime:
                        event.target.value === "PART_TIME"
                          ? current.startTime
                          : "",
                      endTime:
                        event.target.value === "PART_TIME"
                          ? current.endTime
                          : "",
                    }))
                  }
                >
                  <option value="">Tất cả</option>
                  <option value="PART_TIME">Part-time</option>
                  <option value="FULL_TIME">Full-time</option>
                </select>
              </label>
              {filters.jobType === "PART_TIME" ? (
                <>
                  <label className={styles.filterField}>
                    <span>Ngày có thể làm</span>
                    <select
                      value={filters.dayOfWeek}
                      onChange={(event) =>
                        setFilters((current) => ({
                          ...current,
                          dayOfWeek: event.target.value,
                        }))
                      }
                    >
                      <option value="">Tất cả các ngày</option>
                      {WORK_DAYS.map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className={styles.filterField}>
                    <span>Bắt đầu từ</span>
                    <input
                      type="time"
                      value={filters.startTime}
                      onChange={(event) =>
                        setFilters((current) => ({
                          ...current,
                          startTime: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label className={styles.filterField}>
                    <span>Kết thúc trước</span>
                    <input
                      type="time"
                      value={filters.endTime}
                      onChange={(event) =>
                        setFilters((current) => ({
                          ...current,
                          endTime: event.target.value,
                        }))
                      }
                    />
                  </label>
                </>
              ) : null}
              <label className={styles.filterField}>
                <span>Lương tối thiểu (VND)</span>
                <input
                  type="number"
                  min="0"
                  value={filters.salaryMin}
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      salaryMin: event.target.value,
                    }))
                  }
                  placeholder="Không bắt buộc"
                />
              </label>
            </div>
            <div className={styles.filterActions}>
              <button
                type="submit"
                className="button button-primary"
                disabled={isFetching && !data}
              >
                Áp dụng bộ lọc
              </button>
              {hasActiveFilters(filters) || appliedKeyword ? (
                <button
                  type="button"
                  className={styles.clearFilters}
                  onClick={clearAllFilters}
                >
                  Xóa tất cả
                </button>
              ) : null}
            </div>
          </form>
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
                {[job.streetAddress ?? job.location, job.ward, job.province]
                  .filter(Boolean)
                  .join(", ")}
                {job.company?.city ? ` · ${job.company.city}` : ""}
                <br />
                <span className="text-violet-700">{formatSalaryRange(job.salaryMin, job.salaryMax)}</span>
                {" · "}
                {job.workScheduleType === "PART_TIME"
                  ? "Part-time"
                  : job.workScheduleType === "FULL_TIME"
                    ? "Full-time"
                    : job.jobType}
                {job.schedules?.length ? (
                  <>
                    <br />
                    Ca làm:{" "}
                    {job.schedules
                      .map(
                        (schedule) =>
                          `${schedule.shiftName ? `${schedule.shiftName}: ` : ""}${WORK_DAY_LABELS[schedule.dayOfWeek as keyof typeof WORK_DAY_LABELS] ?? schedule.dayOfWeek} ${schedule.startTime}–${schedule.endTime}`,
                      )
                      .join(" · ")}
                  </>
                ) : null}
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
