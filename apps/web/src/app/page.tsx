import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

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
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-4 py-16">
        <section className="max-w-2xl">
          <h1 className="text-4xl font-bold leading-tight tracking-tight">
            Nền tảng tuyển dụng Full-time cho sinh viên và doanh nghiệp
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            Tìm việc, tạo CV, ứng tuyển và kết nối trực tiếp với nhà tuyển dụng.
            Doanh nghiệp đăng tin, quản lý ứng viên và thanh toán dịch vụ an
            toàn.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/viec-lam"
              className="rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"
            >
              Xem việc làm
            </Link>
            <Link
              href="/dang-ky?role=company"
              className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold hover:border-blue-700 hover:text-blue-700"
            >
              Đăng tin tuyển dụng
            </Link>
          </div>
        </section>

        <section className="mt-12 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Trạng thái hệ thống
          </h2>
          {health ? (
            <p className="mt-2 text-sm">
              API:{" "}
              <span className="font-medium text-emerald-700">{health.status}</span>
              {health.services?.database && (
                <>
                  {" "}
                  · Cơ sở dữ liệu:{" "}
                  <span
                    className={
                      health.services.database === "up"
                        ? "font-medium text-emerald-700"
                        : "font-medium text-amber-700"
                    }
                  >
                    {health.services.database}
                  </span>
                </>
              )}
            </p>
          ) : (
            <p className="mt-2 text-sm text-amber-700">
              Không kết nối được API. Khởi động backend tại cổng 4000 và cấu
              hình NEXT_PUBLIC_API_URL.
            </p>
          )}
        </section>
      </main>
    </div>
  );
}
