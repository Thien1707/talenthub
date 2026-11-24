"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  ArrowUpRight,
  Building2,
  DollarSign,
  MapPin,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { api } from "@/lib/api/client";
import { formatSalaryRange } from "@/lib/format-money";
import styles from "./landing-jobs-feed.module.css";

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

type Category = {
  categoryId: string;
  categoryName: string;
  slug: string;
};

const WORK_DAY_LABELS: Record<string, string> = {
  MONDAY: "T2",
  TUESDAY: "T3",
  WEDNESDAY: "T4",
  THURSDAY: "T5",
  FRIDAY: "T6",
  SATURDAY: "T7",
  SUNDAY: "CN",
};

// Việc làm mẫu chất lượng cao khi CSDL chưa có dữ liệu hoặc mới khởi tạo
const SAMPLE_JOBS: JobItem[] = [
  {
    jobId: "sample-1",
    title: "Lập trình viên Frontend (React / Next.js)",
    slug: "lap-trinh-vien-frontend-react-nextjs",
    location: "Quận 7, TP. Hồ Chí Minh",
    province: "TP. Hồ Chí Minh",
    jobType: "VIP",
    workScheduleType: "FULL_TIME",
    highlightUntil: "2099-01-01T00:00:00.000Z",
    salaryMin: "12000000",
    salaryMax: "18000000",
    company: { companyName: "VNG Corporation", city: "TP. Hồ Chí Minh" },
    category: { categoryName: "Công nghệ thông tin" },
  },
  {
    jobId: "sample-2",
    title: "Thực tập sinh Backend (NestJS / Node.js)",
    slug: "thuc-tap-sinh-backend-nestjs-nodejs",
    location: "Khu Công Nghệ Cao, TP. Thủ Đức",
    province: "TP. Hồ Chí Minh",
    jobType: "NORMAL",
    workScheduleType: "PART_TIME",
    salaryMin: "5000000",
    salaryMax: "8000000",
    schedules: [
      { dayOfWeek: "MONDAY", startTime: "08:00", endTime: "12:00", shiftName: "Sáng" },
      { dayOfWeek: "WEDNESDAY", startTime: "08:00", endTime: "12:00", shiftName: "Sáng" },
      { dayOfWeek: "FRIDAY", startTime: "08:00", endTime: "12:00", shiftName: "Sáng" },
    ],
    company: { companyName: "FPT Software HCM", city: "TP. Hồ Chí Minh" },
    category: { categoryName: "Công nghệ thông tin" },
  },
  {
    jobId: "sample-3",
    title: "Chuyên viên Content & Digital Marketing",
    slug: "chuyen-vien-content-digital-marketing",
    location: "Quận 1, TP. Hồ Chí Minh",
    province: "TP. Hồ Chí Minh",
    jobType: "NORMAL",
    workScheduleType: "FULL_TIME",
    promotionTopUntil: "2099-01-01T00:00:00.000Z",
    salaryMin: "10000000",
    salaryMax: "15000000",
    company: { companyName: "Shopee Việt Nam", city: "TP. Hồ Chí Minh" },
    category: { categoryName: "Marketing / Truyền thông" },
  },
  {
    jobId: "sample-4",
    title: "Thực tập sinh Thiết kế UI/UX Product",
    slug: "thuc-tap-sinh-thiet-ke-ui-ux-product",
    location: "Quận 3, TP. Hồ Chí Minh",
    province: "TP. Hồ Chí Minh",
    jobType: "NORMAL",
    workScheduleType: "PART_TIME",
    salaryMin: "4000000",
    salaryMax: "7000000",
    company: { companyName: "MoMo (M-Service)", city: "TP. Hồ Chí Minh" },
    category: { categoryName: "Thiết kế đồ họa" },
  },
  {
    jobId: "sample-5",
    title: "Chuyên viên Phân tích Dữ liệu (Data Analyst Junior)",
    slug: "chuyen-vien-phan-tich-du-lieu-data-analyst",
    location: "Quận Bình Thạnh, TP. Hồ Chí Minh",
    province: "TP. Hồ Chí Minh",
    jobType: "VIP",
    workScheduleType: "FULL_TIME",
    highlightUntil: "2099-01-01T00:00:00.000Z",
    salaryMin: "14000000",
    salaryMax: "20000000",
    company: { companyName: "Tiki Corporation", city: "TP. Hồ Chí Minh" },
    category: { categoryName: "Phân tích dữ liệu" },
  },
  {
    jobId: "sample-6",
    title: "Thực tập sinh Nhân sự & Tuyển dụng (HR Intern)",
    slug: "thuc-tap-sinh-nhan-su-tuyen-dung-hr-intern",
    location: "Quận Tân Bình, TP. Hồ Chí Minh",
    province: "TP. Hồ Chí Minh",
    jobType: "NORMAL",
    workScheduleType: "PART_TIME",
    salaryMin: "3500000",
    salaryMax: "5500000",
    company: { companyName: "Kite Talent Solutions", city: "TP. Hồ Chí Minh" },
    category: { categoryName: "Nhân sự / Tuyển dụng" },
  },
];

function promoActive(until?: string | null) {
  if (!until) return false;
  return new Date(until) > new Date();
}

export function LandingJobsFeed() {
  const [keywordInput, setKeywordInput] = useState("");
  const [appliedKeyword, setAppliedKeyword] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  // Lấy danh mục phổ biến
  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await api.get<Category[]>("/categories");
      return data;
    },
    staleTime: 5 * 60_000,
  });

  // Lấy danh sách việc làm
  const { data, isLoading } = useQuery({
    queryKey: ["jobs", "landing-feed", appliedKeyword, selectedCategory],
    queryFn: async () => {
      const { data } = await api.get<JobsResponse>("/jobs", {
        params: {
          keyword: appliedKeyword || undefined,
          categoryId: selectedCategory || undefined,
          limit: 6,
          page: 1,
        },
      });
      return data;
    },
    staleTime: 60_000,
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedKeyword(keywordInput.trim());
  };

  const handleClearSearch = () => {
    setKeywordInput("");
    setAppliedKeyword("");
  };

  // Xác định danh sách việc làm hiển thị:
  // Ưu tiên dữ liệu từ API nếu có, nếu chưa có tin nào trong hệ thống và chưa lọc thì hiển thị việc làm mẫu
  const hasRealJobs = data?.items && data.items.length > 0;
  const isFiltering = Boolean(appliedKeyword || selectedCategory);
  const displayJobs: JobItem[] = hasRealJobs
    ? data.items
    : isFiltering
      ? []
      : SAMPLE_JOBS;

  return (
    <section className={styles.section} aria-labelledby="jobs-heading">
      {/* Tiêu đề mục */}
      <div className={styles.sectionHeader}>
        <div className={styles.badge}>
          <Sparkles className="h-4 w-4 shrink-0" aria-hidden />
          BẢNG TIN TUYỂN DỤNG MỚI NHẤT
        </div>

        <h2 id="jobs-heading" className={styles.title}>
          Cơ hội việc làm đang tuyển dụng
        </h2>

        <p className={styles.lead}>
          Khám phá các vị trí thực tập, part-time và full-time đã được kiểm duyệt
          minh bạch từ các doanh nghiệp uy tín.
        </p>
      </div>

      {/* Thanh tìm kiếm & lọc nhanh */}
      <div className={styles.toolbar}>
        <form onSubmit={handleSearchSubmit} className={styles.searchBar}>
          <Search className={`h-5 w-5 ${styles.searchIcon}`} aria-hidden />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Tìm theo chức danh, kỹ năng, công ty..."
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
          />
          {keywordInput ? (
            <button
              type="button"
              className={styles.clearBtn}
              onClick={handleClearSearch}
              title="Xóa tìm kiếm"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
          <button type="submit" className={styles.searchBtn}>
            Tìm kiếm
          </button>
        </form>

        {/* Chips danh mục */}
        <div className={styles.categoryChips} role="tablist">
          <button
            type="button"
            className={`${styles.chip} ${!selectedCategory ? styles.chipActive : ""}`}
            onClick={() => setSelectedCategory("")}
          >
            Tất cả ngành nghề
          </button>
          {categories && categories.length > 0
            ? categories.slice(0, 6).map((cat) => (
                <button
                  key={cat.categoryId}
                  type="button"
                  className={`${styles.chip} ${
                    selectedCategory === cat.categoryId ? styles.chipActive : ""
                  }`}
                  onClick={() =>
                    setSelectedCategory(
                      selectedCategory === cat.categoryId ? "" : cat.categoryId,
                    )
                  }
                >
                  {cat.categoryName}
                </button>
              ))
            : [
                "Công nghệ thông tin",
                "Marketing / Truyền thông",
                "Kinh doanh / Bán hàng",
                "Thiết kế đồ họa",
                "Tài chính / Kế toán",
              ].map((name) => (
                <button
                  key={name}
                  type="button"
                  className={styles.chip}
                  onClick={() => setAppliedKeyword(name)}
                >
                  {name}
                </button>
              ))}
        </div>
      </div>

      {/* Grid danh sách bảng tin việc làm */}
      <div className={styles.jobGrid}>
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={styles.skeletonCard}>
              <div className={styles.skeletonBar} style={{ width: "40%" }} />
              <div className={styles.skeletonBar} style={{ width: "80%" }} />
              <div className={styles.skeletonBar} style={{ width: "60%" }} />
            </div>
          ))
        ) : displayJobs.length > 0 ? (
          displayJobs.map((job) => {
            const companyName = job.company?.companyName ?? "Doanh nghiệp";
            const initial = companyName.charAt(0).toUpperCase();

            const promos: string[] = [];
            if (job.jobType === "VIP") promos.push("VIP");
            if (promoActive(job.highlightUntil)) promos.push("Nổi bật");
            if (promoActive(job.promotionTopUntil)) promos.push("Top");
            if (promoActive(job.featuredUntil)) promos.push("Featured");

            const addressText = [
              job.streetAddress ?? job.location,
              job.ward,
              job.province,
            ]
              .filter(Boolean)
              .join(", ");

            return (
              <article key={job.jobId} className={styles.card}>
                {/* Phần trên của thẻ: Avatar + Tag */}
                <div className={styles.cardTop}>
                  <div className={styles.avatar} aria-hidden>
                    {initial}
                  </div>
                  <div className={styles.tagRow}>
                    {job.category?.categoryName ? (
                      <span className={styles.tagCategory}>
                        {job.category.categoryName}
                      </span>
                    ) : null}
                    <span className={styles.tagSchedule}>
                      {job.workScheduleType === "PART_TIME"
                        ? "Part-time"
                        : "Full-time"}
                    </span>
                    {promos.map((p) => (
                      <span key={p} className={styles.tagPromo}>
                        {p}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Thân thẻ: Tiêu đề + Công ty + Lương */}
                <div className={styles.cardBody}>
                  <h3 className={styles.jobTitle}>
                    <Link href={`/viec-lam/${job.slug}`}>{job.title}</Link>
                  </h3>

                  <div className={styles.companyName}>
                    <Building2 className="h-4 w-4 shrink-0 text-violet-500" />
                    <span>{companyName}</span>
                  </div>

                  <div className={styles.location}>
                    <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
                    <span className="truncate">{addressText || "Toàn quốc"}</span>
                  </div>

                  <div className={styles.salary}>
                    <DollarSign className="h-4 w-4 shrink-0" />
                    <span>{formatSalaryRange(job.salaryMin, job.salaryMax)}</span>
                  </div>

                  {job.schedules && job.schedules.length > 0 ? (
                    <div className={styles.scheduleInfo}>
                      Ca làm:{" "}
                      {job.schedules
                        .slice(0, 3)
                        .map(
                          (s) =>
                            `${WORK_DAY_LABELS[s.dayOfWeek] ?? s.dayOfWeek} (${s.startTime}–${s.endTime})`,
                        )
                        .join(" · ")}
                    </div>
                  ) : null}
                </div>

                {/* Chân thẻ: Nút xem chi tiết & ứng tuyển */}
                <div className={styles.cardFooter}>
                  <span className="text-xs font-semibold text-slate-400">
                    Đã kiểm duyệt ✓
                  </span>
                  <Link
                    href={`/viec-lam/${job.slug}`}
                    className={styles.applyLink}
                  >
                    Ứng tuyển ngay
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </div>
              </article>
            );
          })
        ) : (
          <div className={styles.emptyState}>
            <p className={styles.emptyText}>
              Không tìm thấy tin tuyển dụng nào phù hợp với bộ lọc hiện tại.
            </p>
            <button
              type="button"
              className={styles.chip}
              onClick={() => {
                handleClearSearch();
                setSelectedCategory("");
              }}
            >
              Đặt lại bộ lọc
            </button>
          </div>
        )}
      </div>

      {/* Nút xem toàn bộ việc làm */}
      <div className={styles.bottomAction}>
        <Link
          href={
            appliedKeyword
              ? `/viec-lam?keyword=${encodeURIComponent(appliedKeyword)}`
              : "/viec-lam"
          }
          className={`${styles.viewAllBtn} dark-mode-view-all`}
        >
          <span>
            Xem tất cả {data?.total ? `${data.total}+ ` : ""}việc làm
          </span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}

