# Deploy API lên Render

## Nguyên nhân lỗi `nest start` (exit code 134)

Render thường cấu hình **Start Command** là `npm start`. Script cũ chạy `nest start` (biên dịch TypeScript lúc runtime, cần `@nestjs/cli` trong devDependencies). Ở production, Render có thể **không cài devDependencies** hoặc **hết RAM** khi compile → process abort (**code 134**).

API đã đổi `start` thành **`node dist/main`** — bắt buộc **build trước** khi start.

## Cấu hình Web Service (API)

### Cách 1 — Monorepo (khuyến nghị): Root Directory = *(để trống, root repo)*

| Mục | Giá trị |
|-----|---------|
| **Root Directory** | *(trống)* |
| **Build Command** | `npm install && npm run build && npm run db:deploy` |
| **Start Command** | `npm run start:api` |

Biến môi trường: copy từ `apps/api/.env.example` (DATABASE_URL, JWT_*, WEB_URL, API_URL, …). Render tự gán **PORT** — không cần hard-code.

### Cách 2 — Root Directory = `apps/api`

| Mục | Giá trị |
|-----|---------|
| **Root Directory** | `apps/api` |
| **Build Command** | `cd ../.. && npm install && npm run build -w api && npm run prisma:deploy -w api` |
| **Start Command** | `npm start` |

*(Build phải chạy từ root workspace để npm workspaces và Prisma hoạt động đúng.)*

## Sau khi deploy

- Health: `GET https://<service>.onrender.com/api/v1/health` (nếu có route health)
- Swagger: `https://<service>.onrender.com/api/docs`
- **WEB_URL** trên API = URL frontend (CORS)
- Frontend **NEXT_PUBLIC_API_URL** = `https://<service>.onrender.com/api/v1`

## Free tier

Instance sleep khi idle; lần wake đầu có thể chậm. Nếu build vẫn fail, xem **Logs** ngay trước dòng `Lifecycle script start failed` — thiếu `dist/main.js` nghĩa là build chưa chạy hoặc fail.
