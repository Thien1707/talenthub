import { Briefcase, Sparkles } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { HomeHeroActions } from "@/components/home-hero-actions";

async function getHealth() {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";
  try {
    const res = await fetch(`${base}/health`, { next: { revalidate: 30 } });
    if (!res.ok) return null;
    return (await res.json()) as {
      status: string;
      services?: { database?: string };
    };
  } catch {
    return null;
  }
}

export default async function Home() {
  const health = await getHealth();

  return (
    <AppShell hideFooter={false}>
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white">
        <div className="hero-glow hero-glow-left" />
        <div className="hero-glow hero-glow-right" />
        <div className="relative grid items-center gap-12 px-6 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:px-12 lg:py-20">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3.5 py-2 text-sm font-semibold text-blue-700">
              <Sparkles className="h-4 w-4" aria-hidden />
              Nền tảng tuyển dụng cho sinh viên & doanh nghiệp
            </div>
            <h1 className="max-w-3xl text-4xl font-extrabold leading-tight tracking-tight text-slate-950 sm:text-5xl">
              Việc làm phù hợp,
              <span className="block text-blue-600">kết nối đúng người.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              Tìm việc full-time, tạo CV, ứng tuyển và chat trực tiếp với nhà
              tuyển dụng. Doanh nghiệp đăng tin, duyệt ứng viên và thanh toán
              dịch vụ an toàn qua VNPAY.
            </p>
            <HomeHeroActions />
          </div>
          <div className="hidden lg:block" aria-hidden>
            <div className="relative mx-auto max-w-md">
              <div className="absolute inset-4 rounded-[2rem] bg-gradient-to-br from-blue-600 to-indigo-700 shadow-2xl shadow-blue-200" />
              <div className="relative rounded-2xl border border-slate-100 bg-white p-6 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-blue-50 text-blue-600">
                    <Briefcase className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">TalentHub</p>
                    <p className="text-sm text-slate-500">CV · AI · Ứng tuyển</p>
                  </div>
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="job-tag">Full-time</span>
                  <span className="job-tag">Duyệt tin</span>
                  <span className="job-tag">Chat</span>
                </div>
                <p className="mt-5 border-t border-slate-100 pt-4 text-sm text-slate-600">
                  Kết nối sinh viên với doanh nghiệp đã xác minh.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-12 th-card">
        <p className="eyebrow mb-0">Hệ thống</p>
        <h2 className="section-title mt-2 text-xl sm:text-2xl">Trạng thái dịch vụ</h2>
        {health ? (
          <p className="mt-3 text-sm text-slate-600">
            API:{" "}
            <span className="font-bold text-emerald-700">{health.status}</span>
            {health.services?.database && (
              <>
                {" "}
                · Cơ sở dữ liệu:{" "}
                <span
                  className={
                    health.services.database === "up"
                      ? "font-bold text-emerald-700"
                      : "font-bold text-amber-700"
                  }
                >
                  {health.services.database}
                </span>
              </>
            )}
          </p>
        ) : (
          <p className="mt-3 text-sm font-medium text-amber-700">
            Không kết nối được API. Khởi động backend (cổng 4000) và cấu hình
            NEXT_PUBLIC_API_URL.
          </p>
        )}
      </section>
    </AppShell>
  );
}
