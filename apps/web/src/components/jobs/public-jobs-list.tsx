"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowRight, MapPin, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
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
};

function promoActive(until?: string | null) {
  if (!until) return false;
  return new Date(until) > new Date();
}

export function PublicJobsList() {
  const [keyword, setKeyword] = useState("");
  const [search, setSearch] = useState("");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["jobs", "public", search],
    queryFn: async () => {
      const { data } = await api.get<{
        items: JobItem[];
        total: number;
      }>("/jobs", { params: { keyword: search || undefined, limit: 20 } });
      return data;
    },
  });

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-lg shadow-slate-200/50">
        <form
          className="flex flex-col gap-2 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            setSearch(keyword.trim());
          }}
        >
          <label className="flex min-h-12 flex-1 items-center gap-3 rounded-xl px-3 focus-within:bg-slate-50">
            <Search className="h-5 w-5 shrink-0 text-slate-400" aria-hidden />
            <span className="sr-only">Từ khóa</span>
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Vị trí, kỹ năng hoặc công ty..."
              className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-slate-400"
            />
          </label>
          <button type="submit" className="button button-primary min-h-12 px-6">
            Tìm kiếm
          </button>
        </form>
      </div>

      {isLoading && (
        <p className="text-sm font-medium text-slate-500">Đang tải tin tuyển dụng…</p>
      )}
      {isError && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Không tải được danh sách. Kiểm tra API và NEXT_PUBLIC_API_URL.
        </p>
      )}
      {!isLoading && !isError && data?.items.length === 0 && (
        <p className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-10 text-center text-slate-500">
          Chưa có tin tuyển dụng công khai phù hợp bộ lọc.
        </p>
      )}

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
    </div>
  );
}
