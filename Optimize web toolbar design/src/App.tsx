import { useMemo, useState, type ReactNode } from "react";

type IconName =
  | "arrow"
  | "bell"
  | "briefcase"
  | "calendar"
  | "chevron"
  | "clock"
  | "code"
  | "design"
  | "heart"
  | "location"
  | "marketing"
  | "menu"
  | "search"
  | "sparkles"
  | "user"
  | "users"
  | "x";

const icons: Record<IconName, ReactNode> = {
  arrow: <path d="M5 12h14m-5-5 5 5-5 5" />,
  bell: (
    <>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M10 21h4" />
    </>
  ),
  briefcase: (
    <>
      <rect width="18" height="14" x="3" y="7" rx="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18M10 12v2h4v-2" />
    </>
  ),
  calendar: (
    <>
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </>
  ),
  chevron: <path d="m9 18 6-6-6-6" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  code: (
    <>
      <path d="m8 9-3 3 3 3M16 9l3 3-3 3M14 5l-4 14" />
    </>
  ),
  design: (
    <>
      <path d="M12 3a9 9 0 1 0 0 18c1.2 0 2-1 1.5-2-.5-1 .2-2 1.5-2h2a4 4 0 0 0 4-4c0-5.5-4-10-9-10Z" />
      <circle cx="7.5" cy="10" r=".7" fill="currentColor" stroke="none" />
      <circle cx="10" cy="6.5" r=".7" fill="currentColor" stroke="none" />
      <circle cx="15" cy="7.5" r=".7" fill="currentColor" stroke="none" />
    </>
  ),
  heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />,
  location: (
    <>
      <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  marketing: (
    <>
      <path d="m3 11 18-5v12L3 13v-2ZM7 14v6h4v-5" />
    </>
  ),
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </>
  ),
  sparkles: (
    <>
      <path d="m12 3 1.2 3.8L17 8l-3.8 1.2L12 13l-1.2-3.8L7 8l3.8-1.2L12 3Z" />
      <path d="m19 15 .7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7L19 15ZM5 2l.7 2.3L8 5l-2.3.7L5 8l-.7-2.3L2 5l2.3-.7L5 2Z" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ),
  users: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" />
    </>
  ),
  x: <path d="M18 6 6 18M6 6l12 12" />,
};

function Icon({ name, size = "md" }: { name: IconName; size?: "sm" | "md" | "lg" }) {
  const dimensions = size === "sm" ? "h-4 w-4" : size === "lg" ? "h-6 w-6" : "h-5 w-5";
  return (
    <svg
      aria-hidden="true"
      className={dimensions}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {icons[name]}
    </svg>
  );
}

const categories = [
  { name: "Thiết kế", count: "128 việc làm", icon: "design" as IconName, color: "bg-violet-50 text-violet-600" },
  { name: "Lập trình", count: "96 việc làm", icon: "code" as IconName, color: "bg-blue-50 text-blue-600" },
  { name: "Marketing", count: "84 việc làm", icon: "marketing" as IconName, color: "bg-orange-50 text-orange-600" },
  { name: "Trợ giảng", count: "72 việc làm", icon: "users" as IconName, color: "bg-emerald-50 text-emerald-600" },
];

const jobs = [
  {
    id: 1,
    company: "M",
    companyName: "Mây Studio",
    title: "Thiết kế Social Media Part-time",
    location: "Hồ Chí Minh",
    salary: "3–5 triệu",
    schedule: "Linh hoạt",
    tags: ["Thiết kế", "Remote"],
    color: "bg-violet-100 text-violet-700",
  },
  {
    id: 2,
    company: "N",
    companyName: "Nova Tech",
    title: "Frontend Developer Intern",
    location: "Hà Nội",
    salary: "5–7 triệu",
    schedule: "20 giờ/tuần",
    tags: ["React", "Hybrid"],
    color: "bg-sky-100 text-sky-700",
  },
  {
    id: 3,
    company: "L",
    companyName: "Lumos English",
    title: "Trợ giảng tiếng Anh buổi tối",
    location: "Đà Nẵng",
    salary: "45–60K/giờ",
    schedule: "Ca tối",
    tags: ["Giáo dục", "Tại chỗ"],
    color: "bg-amber-100 text-amber-700",
  },
];

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="grid h-9 w-9 place-items-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-200">
        <Icon name="sparkles" />
      </div>
      <div className="text-xl font-extrabold tracking-tight text-slate-900">
        Uni<span className="text-blue-600">Work</span>
      </div>
    </div>
  );
}

function App() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [savedJobs, setSavedJobs] = useState<number[]>([]);
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("Toàn quốc");
  const [searchMessage, setSearchMessage] = useState("");

  const resultLabel = useMemo(() => {
    if (!searchMessage) return "";
    const where = location === "Toàn quốc" ? "toàn quốc" : location;
    return keyword.trim()
      ? `Đang tìm “${keyword.trim()}” tại ${where}`
      : `Đang tìm việc làm tại ${where}`;
  }, [keyword, location, searchMessage]);

  function handleSearch() {
    setSearchMessage("searched");
    document.querySelector("#featured-jobs")?.scrollIntoView({ behavior: "smooth" });
  }

  function toggleSaved(id: number) {
    setSavedJobs((current) =>
      current.includes(id) ? current.filter((jobId) => jobId !== id) : [...current, id],
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-5 lg:px-8">
          <Logo />

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Điều hướng chính">
            <a className="nav-link nav-link-active" href="#jobs">Tìm việc</a>
            <a className="nav-link" href="#categories">Danh mục</a>
            <a className="nav-link" href="#how-it-works">Cách hoạt động</a>
            <a className="nav-link" href="#employers">Cho nhà tuyển dụng</a>
          </nav>

          <div className="hidden items-center gap-2 sm:flex">
            <button className="icon-button relative" aria-label="Thông báo">
              <Icon name="bell" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-white bg-red-500" />
            </button>
            <span className="mx-1 hidden h-6 w-px bg-slate-200 xl:block" />
            <button className="button button-ghost hidden xl:inline-flex">Đăng nhập</button>
            <button className="button button-primary">Đăng việc miễn phí</button>
          </div>

          <button
            className="icon-button sm:hidden"
            onClick={() => setMobileOpen((open) => !open)}
            aria-label={mobileOpen ? "Đóng menu" : "Mở menu"}
            aria-expanded={mobileOpen}
          >
            <Icon name={mobileOpen ? "x" : "menu"} />
          </button>
        </div>

        {mobileOpen && (
          <div className="border-t border-slate-100 bg-white px-5 py-4 sm:hidden">
            <nav className="grid gap-1" aria-label="Điều hướng di động">
              <a className="mobile-nav-link" href="#jobs">Tìm việc</a>
              <a className="mobile-nav-link" href="#categories">Danh mục</a>
              <a className="mobile-nav-link" href="#how-it-works">Cách hoạt động</a>
              <a className="mobile-nav-link" href="#employers">Cho nhà tuyển dụng</a>
              <div className="mt-3 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
                <button className="button button-secondary">Đăng nhập</button>
                <button className="button button-primary">Đăng việc</button>
              </div>
            </nav>
          </div>
        )}
      </header>

      <main>
        <section id="jobs" className="relative overflow-hidden bg-white">
          <div className="hero-glow hero-glow-left" />
          <div className="hero-glow hero-glow-right" />
          <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 pb-18 pt-16 lg:grid-cols-[1.08fr_0.92fr] lg:px-8 lg:pb-24 lg:pt-20">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3.5 py-2 text-sm font-semibold text-blue-700">
                <Icon name="sparkles" size="sm" />
                Nền tảng việc làm dành riêng cho sinh viên
              </div>
              <h1 className="max-w-3xl text-4xl font-extrabold leading-tight tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                Việc làm phù hợp,
                <span className="block text-blue-600">khởi đầu vững vàng.</span>
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
                Kết nối sinh viên với những cơ hội part-time uy tín, linh hoạt và phù hợp với lịch học.
              </p>

              <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-200/60">
                <div className="grid gap-2 md:grid-cols-[1fr_auto_auto]">
                  <label className="flex min-h-13 items-center gap-3 rounded-xl px-3 focus-within:bg-slate-50">
                    <span className="text-slate-400"><Icon name="search" /></span>
                    <span className="sr-only">Vị trí công việc</span>
                    <input
                      className="w-full bg-transparent text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400"
                      placeholder="Vị trí, kỹ năng hoặc công ty..."
                      value={keyword}
                      onChange={(event) => setKeyword(event.target.value)}
                      onKeyDown={(event) => event.key === "Enter" && handleSearch()}
                    />
                  </label>
                  <label className="flex min-h-13 items-center gap-2 rounded-xl border-t border-slate-100 px-3 md:min-w-44 md:border-l md:border-t-0">
                    <span className="text-slate-400"><Icon name="location" /></span>
                    <span className="sr-only">Địa điểm</span>
                    <select
                      className="w-full cursor-pointer bg-transparent text-sm font-medium text-slate-700 outline-none"
                      value={location}
                      onChange={(event) => setLocation(event.target.value)}
                    >
                      <option>Toàn quốc</option>
                      <option>Hồ Chí Minh</option>
                      <option>Hà Nội</option>
                      <option>Đà Nẵng</option>
                    </select>
                  </label>
                  <button className="button button-primary min-h-13 px-6" onClick={handleSearch}>
                    <Icon name="search" size="sm" />
                    Tìm việc ngay
                  </button>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-500">
                <span className="font-medium text-slate-700">Từ khóa phổ biến:</span>
                <button className="hover:text-blue-600" onClick={() => setKeyword("Thiết kế")}>Thiết kế</button>
                <button className="hover:text-blue-600" onClick={() => setKeyword("Lập trình")}>Lập trình</button>
                <button className="hover:text-blue-600" onClick={() => setKeyword("Gia sư")}>Gia sư</button>
                <button className="hover:text-blue-600" onClick={() => setKeyword("Marketing")}>Marketing</button>
              </div>
            </div>

            <div className="relative hidden min-h-112 lg:block" aria-label="Minh họa bảng việc làm">
              <div className="absolute inset-8 rounded-[2.5rem] bg-gradient-to-br from-blue-600 to-indigo-700 shadow-2xl shadow-blue-200" />
              <div className="absolute left-0 top-10 w-72 rotate-[-3deg] rounded-2xl border border-slate-100 bg-white p-5 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-violet-100 font-bold text-violet-700">M</div>
                  <div>
                    <p className="font-bold text-slate-900">UI/UX Designer</p>
                    <p className="text-sm text-slate-500">Mây Studio</p>
                  </div>
                </div>
                <div className="mt-5 flex gap-2">
                  <span className="job-tag">Part-time</span>
                  <span className="job-tag">Remote</span>
                </div>
                <div className="mt-5 border-t border-slate-100 pt-4 font-bold text-blue-600">4–6 triệu / tháng</div>
              </div>
              <div className="absolute bottom-7 right-0 w-80 rotate-2 rounded-2xl border border-slate-100 bg-white p-5 shadow-xl">
                <div className="flex items-center justify-between">
                  <p className="font-bold">Hồ sơ của bạn</p>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">Rất tốt</span>
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full w-[84%] rounded-full bg-emerald-500" />
                </div>
                <p className="mt-2 text-sm text-slate-500">Đã hoàn thiện 84%</p>
              </div>
              <div className="absolute right-5 top-3 rounded-2xl border border-blue-100 bg-white p-4 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-blue-50 text-blue-600"><Icon name="briefcase" /></div>
                  <div>
                    <p className="text-xl font-extrabold">1,200+</p>
                    <p className="text-xs text-slate-500">Việc mới mỗi tháng</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="categories" className="mx-auto max-w-7xl px-5 py-18 lg:px-8">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Khám phá cơ hội</p>
              <h2 className="section-title">Danh mục việc làm nổi bật</h2>
            </div>
            <button className="text-link">Xem tất cả <Icon name="arrow" size="sm" /></button>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((category) => (
              <button key={category.name} className="category-card text-left">
                <span className={`grid h-12 w-12 place-items-center rounded-xl ${category.color}`}>
                  <Icon name={category.icon} />
                </span>
                <span className="mt-5 block text-base font-bold text-slate-900">{category.name}</span>
                <span className="mt-1 flex items-center justify-between text-sm text-slate-500">
                  {category.count}
                  <Icon name="chevron" size="sm" />
                </span>
              </button>
            ))}
          </div>
        </section>

        <section id="featured-jobs" className="border-y border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-5 py-18 lg:px-8">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Được tuyển gấp</p>
                <h2 className="section-title">Việc làm mới dành cho bạn</h2>
                {resultLabel && <p className="mt-2 text-sm font-medium text-blue-600">{resultLabel}</p>}
              </div>
              <button className="text-link">Khám phá thêm <Icon name="arrow" size="sm" /></button>
            </div>

            <div className="mt-8 grid gap-5 lg:grid-cols-3">
              {jobs.map((job) => {
                const isSaved = savedJobs.includes(job.id);
                return (
                  <article className="job-card" key={job.id}>
                    <div className="flex items-start justify-between gap-4">
                      <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl text-lg font-extrabold ${job.color}`}>
                        {job.company}
                      </div>
                      <button
                        className={`icon-button ${isSaved ? "bg-rose-50 text-rose-500" : ""}`}
                        onClick={() => toggleSaved(job.id)}
                        aria-label={isSaved ? "Bỏ lưu việc làm" : "Lưu việc làm"}
                      >
                        <span className={isSaved ? "fill-current" : ""}><Icon name="heart" /></span>
                      </button>
                    </div>
                    <p className="mt-5 text-sm font-semibold text-slate-500">{job.companyName}</p>
                    <h3 className="mt-1 text-lg font-bold leading-7 text-slate-900">{job.title}</h3>
                    <div className="mt-4 grid gap-2 text-sm text-slate-500">
                      <p className="flex items-center gap-2"><Icon name="location" size="sm" /> {job.location}</p>
                      <p className="flex items-center gap-2"><Icon name="clock" size="sm" /> {job.schedule}</p>
                    </div>
                    <div className="mt-5 flex flex-wrap gap-2">
                      {job.tags.map((tag) => <span className="job-tag" key={tag}>{tag}</span>)}
                    </div>
                    <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-5">
                      <span className="font-extrabold text-blue-600">{job.salary}</span>
                      <button className="text-link">Ứng tuyển <Icon name="arrow" size="sm" /></button>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="mx-auto max-w-7xl px-5 py-18 lg:px-8">
          <div className="rounded-3xl bg-slate-950 px-6 py-10 text-white sm:px-10 lg:flex lg:items-center lg:justify-between lg:px-14">
            <div className="max-w-xl">
              <p className="text-sm font-bold uppercase tracking-widest text-blue-300">Dành cho nhà tuyển dụng</p>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">Tìm ứng viên trẻ, nhanh và phù hợp.</h2>
              <p className="mt-4 leading-7 text-slate-300">Đăng tin miễn phí, quản lý ứng viên và xây dựng đội ngũ linh hoạt chỉ trên một nền tảng.</p>
            </div>
            <button className="button mt-7 bg-white text-slate-950 hover:bg-blue-50 lg:mt-0">
              Đăng tin tuyển dụng <Icon name="arrow" size="sm" />
            </button>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-8 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <Logo />
          <p className="text-sm text-slate-500">Kết nối đúng việc. Khởi đầu đúng hướng.</p>
          <p className="text-sm text-slate-400">© 2025 UniWork</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
