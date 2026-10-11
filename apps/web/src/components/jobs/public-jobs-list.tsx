"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { api } from "@/lib/api/client";

type JobItem = {
  jobId: string;
  title: string;
  slug: string;
  location: string;
  jobType: string;
  salaryMin?: string | null;
  salaryMax?: string | null;
  company?: { companyName: string; city?: string | null };
};

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
    <div className="space-y-6">
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setSearch(keyword.trim());
        }}
      >
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Từ khóa, vị trí..."
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2"
        />
        <button
          type="submit"
          className="rounded-lg bg-blue-700 px-4 py-2 text-white hover:bg-blue-800"
        >
          Tìm kiếm
        </button>
      </form>

      {isLoading && <p className="text-slate-500">Đang tải tin tuyển dụng...</p>}
      {isError && (
        <p className="text-red-600">Không tải được danh sách. Kiểm tra API.</p>
      )}
      {!isLoading && !isError && data?.items.length === 0 && (
        <p className="text-slate-500">Chưa có tin tuyển dụng công khai.</p>
      )}
      <ul className="space-y-3">
        {data?.items.map((job) => (
          <li
            key={job.jobId}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <Link
                  href={`/viec-lam/${job.slug}`}
                  className="text-lg font-semibold text-blue-800 hover:underline"
                >
                  {job.title}
                </Link>
                <p className="text-sm text-slate-600">
                  {job.company?.companyName} · {job.location}
                </p>
              </div>
              {job.jobType === "VIP" && (
                <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                  VIP
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
