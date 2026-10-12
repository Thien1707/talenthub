# Deploy frontend (Next.js) lên Vercel

## Lỗi `@tailwindcss/postcss` / webpack khi `next build`

Tailwind v4 cần lúc **build** trên Vercel. Repo đã chuyển `tailwindcss` + `@tailwindcss/postcss` sang **dependencies** (không chỉ devDependencies).

**Install Command** (dashboard hoặc `vercel.json`): `cd ../.. && NPM_CONFIG_PRODUCTION=false npm install`

**Build Command** phải là `npm run build`, **không** phải `npm install`.

---

## Lỗi `.next` không tìm thấy tại `apps/web/.next`

Thường do một trong các nguyên nhân sau:

1. **Root Directory** trỏ sai — Vercel build ở root repo nhưng app Next nằm trong `apps/web`.
2. **Build Command** chạy `npm run build` ở **root monorepo** — script đó (nếu có) chỉ build **API**, không chạy `next build` → không có thư mục `.next`.
3. **npm workspaces** — chỉ `npm install` trong `apps/web` không đủ; cần cài từ root repo.

## Cấu hình khuyến nghị

Trong **Vercel → Project → Settings → General**:

| Mục | Giá trị |
|-----|---------|
| **Root Directory** | `apps/web` |
| **Framework Preset** | Next.js |
| **Build Command** | *(để trống — dùng `vercel.json` hoặc mặc định `npm run build`)* |
| **Output Directory** | *(để trống — Next.js tự quản lý `.next`)* |
| **Install Command** | *(để trống — dùng `apps/web/vercel.json`)* |

File [`apps/web/vercel.json`](../apps/web/vercel.json) đã cấu hình:

- `installCommand`: `cd ../.. && NPM_CONFIG_PRODUCTION=false npm install`
- `buildCommand`: `npm run build` (chạy `next build` trong `apps/web`)

## Biến môi trường (Vercel → Environment Variables)

| Biến | Ví dụ |
|------|--------|
| `NEXT_PUBLIC_API_URL` | `https://your-api.onrender.com/api/v1` |

Trên API (Render), đặt **WEB_URL** = URL Vercel (ví dụ `https://your-app.vercel.app`) để CORS hoạt động.

## Monorepo — không dùng Turborepo

Không cần `turbo.json`. Chỉ cần **Root Directory = `apps/web`** và `outputFileTracingRoot` trong `next.config.ts` (đã cấu hình).

## Kiểm tra sau deploy

- Mở trang chủ Vercel
- Đăng nhập → request tới `NEXT_PUBLIC_API_URL` phải trỏ API production, không còn `localhost`
