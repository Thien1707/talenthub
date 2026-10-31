# Deploy API lên Render

## Lỗi `build` exit code **134** (`prisma generate && nest build`)

Thường là **hết RAM** trên gói free Render khi biên dịch TypeScript. Repo đã bật **SWC** (`nest-cli.json`) để build nhẹ hơn.

Trên Render thêm env **NODE_VERSION** = `22`, và trong Build Command có `NODE_OPTIONS=--max-old-space-size=512` (xem bảng dưới). Push code mới có `@swc/core` rồi deploy lại.

---

## Lỗi `Cannot find module .../dist/main.js`

Start chạy trước khi có file build. Thường do **Build Command để trống** hoặc **chỉ `npm install`** (không có `nest build`).

Log chỉ thấy `Running 'npm run start'` / `node dist/main.js` mà **không** có `nest build` ở bước Build → cần sửa lệnh bên dưới.

Script `npm start` trong `apps/api` giờ dùng `scripts/start-prod.cjs`: **tự build nếu thiếu `dist`** (cần đã cài devDependencies lúc build).

---

## Cấu hình A — Root Directory `apps/api` (hay dùng)

**Settings → Build & Deploy**

| Mục | Giá trị |
|-----|---------|
| **Root Directory** | `apps/api` |
| **Build Command** | `cd ../.. && NPM_CONFIG_PRODUCTION=false npm install && NODE_OPTIONS=--max-old-space-size=512 npm run build -w api && npm run prisma:deploy -w api` |
| **Start Command** | `npm start` |

---

## Cấu hình B — Root repo (monorepo)

| Mục | Giá trị |
|-----|---------|
| **Root Directory** | *(trống)* |
| **Build Command** | `NPM_CONFIG_PRODUCTION=false npm install && npm run build:render && npm run db:deploy` |
| **Start Command** | `npm run start:api` |

---

## Cấu hình C — Build Command trống (tạm thời)

Chỉ khi chưa kịp sửa Build; mỗi lần start sẽ build lại (chậm hơn).

| Root Directory | *(trống)* |
| **Build Command** | `NPM_CONFIG_PRODUCTION=false npm install` |
| **Start Command** | `npm run start:render` |

`start:render` = build API + chạy `node dist/main.js`.

---

## Biến môi trường

Theo `apps/api/.env.example`: `DATABASE_URL`, `JWT_*`, `WEB_URL`, `API_URL`, …

Render gán **PORT** — không set `PORT=4000`.

- **WEB_URL** = URL Vercel production (vd. `https://talenthub-gray.vercel.app`) — **bắt buộc** cho CORS
- **CORS_ALLOW_VERCEL** = `true` nếu bạn mở FE bằng URL preview `*.vercel.app`
- **CORS_ORIGINS** = thêm origin (cách nhau dấu phẩy) nếu không dùng `CORS_ALLOW_VERCEL`
- **API_URL** = URL Render (vd. `https://xxx.onrender.com`)

**WebSocket (chat):** Socket.IO gắn cùng process HTTP — path `/socket.io`, namespace `/chat`. Render Web Service hỗ trợ WSS; không cần service riêng. Bật **CORS_ALLOW_VERCEL=true** hoặc khai báo **WEB_URL** đúng URL Vercel.

Monorepo: Build phải `npm install` tại **root** repo (không chỉ `apps/api`) để `@nestjs/websockets` nằm cạnh `@nestjs/core` — nếu thiếu, log API **không** có `Chat gateway initialized` và `/socket.io` trả **404**.

Lỗi console *Access-Control-Allow-Origin … localhost:3000* → **WEB_URL trên Render vẫn là local**; sửa env và **restart** service.

## Node

Repo có `.node-version` (22). Trên Render: **Environment → NODE_VERSION = 22** (tránh Node 24 nếu không cần).

## Kiểm tra

- `GET https://<host>/api/v1/health`
- Swagger: `/api/docs`

## Blueprint

[`render.yaml`](../render.yaml) — copy build/start vào dashboard hoặc deploy Blueprint.
