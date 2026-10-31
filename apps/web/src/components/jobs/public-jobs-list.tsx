"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Loader2, MapPin, Search, X } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/lib/api/client";
import { formatSalaryRange } from "@/lib/format-money";

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
    <div className="space-y-6">
      <div
        ref={suggestRef}
        className="relative rounded-2xl border border-slate-200 bg-white p-2 shadow-lg shadow-slate-200/50"
      >
        <form
          className="flex flex-col gap-2 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            submitSearch();
          }}
        >
          <label className="relative flex min-h-12 flex-1 items-center gap-3 rounded-xl px-3 focus-within:bg-slate-50">
            <Search className="h-5 w-5 shrink-0 text-slate-400" aria-hidden />
            <span className="sr-only">Từ khóa tìm việc</span>
            <input
              value={keyword}
              onChange={(e) => {
                setKeyword(e.target.value);
                setSuggestOpen(true);
              }}
              onFocus={() => keyword.trim().length >= 2 && setSuggestOpen(true)}
              onKeyDown={(e) => {
                if (e.key === "Escape") setSuggestOpen(false);
              }}
              placeholder="Tìm kiếm vị trí, ngành nghề, công ty..."
              className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-slate-400"
              autoComplete="off"
            />
            {keyword ? (
              <button
                type="button"
                aria-label="Xóa từ khóa"
                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                onClick={() => clearSearch()}
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </label>
          <button
            type="submit"
            className="button button-primary min-h-12 px-6"
            disabled={isFetching && !data}
          >
            Tìm việc
          </button>
        </form>

        {suggestOpen && keyword.trim().length >= 2 && hasSuggestions ? (
          <ul className="absolute left-2 right-2 top-full z-20 mt-1 max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
            {suggestions?.categories.map((c) => (
              <li key={c.categoryId}>
                <button
                  type="button"
                  className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50"
                  onClick={() => submitSearch(c.name)}
                >
                  <span className="text-xs text-slate-500">Ngành · </span>
                  {c.name}
                </button>
              </li>
            ))}
            {suggestions?.titles.map((title) => (
              <li key={title}>
                <button
                  type="button"
                  className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50"
                  onClick={() => submitSearch(title)}
                >
                  {title}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {appliedKeyword ? (
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
          <span>
            Kết quả cho &quot;<strong className="text-slate-900">{appliedKeyword}</strong>&quot;
            {data != null && (
              <>
                {" "}
                · <strong>{data.total}</strong> việc làm
              </>
            )}
          </span>
          <button
            type="button"
            className="text-link text-sm font-medium"
            onClick={clearSearch}
          >
            Xóa tìm kiếm
          </button>
        </div>
      ) : data != null ? (
        <p className="text-sm text-slate-600">
          <strong>{data.total}</strong> tin tuyển dụng đang mở
        </p>
      ) : null}

      {isLoading && !data && (
        <p className="flex items-center gap-2 text-sm font-medium text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          Đang tải tin tuyển dụng…
        </p>
      )}
      {isError && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Không tải được danh sách. Kiểm tra API và NEXT_PUBLIC_API_URL.
        </p>
      )}

      {!isLoading && !isError && data?.items.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-10 text-center">
          <p className="text-slate-700">
            {appliedKeyword
              ? "Không tìm thấy việc làm phù hợp với từ khóa của bạn."
              : "Chưa có tin tuyển dụng công khai."}
          </p>
          {appliedKeyword ? (
            <p className="mt-2 text-sm text-slate-500">
              Thử từ khóa khác (vd: IT, Frontend, Kế toán, Marketing).
            </p>
          ) : null}
        </div>
      )}

      {isFetching && data ? (
        <p className="flex items-center gap-2 text-xs text-slate-500">
          <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
          Đang cập nhật…
        </p>
      ) : null}

      <ul className="grid gap-5 md:grid-cols-2">
        {data?.items.map((job) => (
          <li key={job.jobId}>
            <article className="job-card h-full">
              <div className="flex items-start justify-between gap-3">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-blue-100 text-lg font-extrabold text-blue-700">
                  {(job.company?.companyName ?? "T").charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-wrap gap-1">
                  {job.jobType === "VIP" && (
                    <span className="job-tag bg-amber-100 text-amber-800">VIP</span>
                  )}
                  {promoActive(job.highlightUntil) && (
                    <span className="job-tag bg-violet-100 text-violet-800">Nổi bật</span>
                  )}
                  {promoActive(job.promotionTopUntil) && (
                    <span className="job-tag bg-sky-100 text-sky-800">Top</span>
                  )}
                  {promoActive(job.featuredUntil) && (
                    <span className="job-tag bg-emerald-100 text-emerald-800">Featured</span>
                  )}
                </div>
              </div>
              <p className="mt-4 text-sm font-semibold text-slate-500">
                {job.company?.companyName ?? "Doanh nghiệp"}
              </p>
              <h2 className="mt-1 text-lg font-bold leading-snug text-slate-900">
                <Link
                  href={`/viec-lam/${job.slug}`}
                  className="hover:text-blue-600"
                >
                  {job.title}
                </Link>
              </h2>
              <p className="mt-3 flex items-center gap-2 text-sm text-slate-500">
                <MapPin className="h-4 w-4 shrink-0" aria-hidden />
                {job.location}
                {job.company?.city ? ` · ${job.company.city}` : ""}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <span className="job-tag">{job.jobType}</span>
                {job.category?.categoryName ? (
                  <span className="job-tag bg-slate-100 text-slate-700">
                    {job.category.categoryName}
                  </span>
                ) : null}
              </div>
              <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-5">
                <span className="font-extrabold text-blue-600">
                  {formatSalaryRange(job.salaryMin, job.salaryMax)}
                </span>
                <Link href={`/viec-lam/${job.slug}`} className="text-link">
                  Chi tiết
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </article>
          </li>
        ))}
      </ul>

      {data && totalPages > 1 ? (
        <nav
          className="flex flex-wrap items-center justify-center gap-2 pt-2"
          aria-label="Phân trang"
        >
          <button
            type="button"
            className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40"
            disabled={page <= 1 || isFetching}
            onClick={() => goPage(page - 1)}
          >
            Trước
          </button>
          <span className="text-sm text-slate-600">
            Trang {page} / {totalPages}
          </span>
          <button
            type="button"
            className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40"
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
