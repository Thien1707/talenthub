# Hướng dẫn cài đặt TalentHub (máy mới)

## 1. Công cụ

1. Cài [Node.js LTS](https://nodejs.org/) (≥ 20).
2. **Database:** MySQL local **hoặc** Aiven DBaaS (SSL).

### Aiven MySQL (khuyến nghị nếu bạn dùng cloud)

1. Copy **Service URI** từ console (user `avnadmin`, database `defaultdb`, port thường ≠ 3306).
2. Tải **CA certificate** → `apps/api/certs/aiven-ca.pem`.
3. Trong `apps/api/.env`:

```env
DATABASE_URL=mysql://avnadmin:MAT_KHAU_CUA_BAN@mysql-XXXX.d.aivencloud.com:19052/defaultdb?sslaccept=strict
```

Mật khẩu lấy bằng **Reveal** trên Aiven; nếu có `@`, `#`, `%`… hãy [URL-encode](https://developer.mozilla.org/en-US/docs/Glossary/Percent-encoding) trước khi dán vào URI.

4. Chạy migration:

```bash
cd apps/api
npm run prisma:generate
npx prisma migrate deploy
npm run prisma:seed
```

Nếu lỗi SSL trên Windows: xem `apps/api/certs/README.md` (`accept_invalid_certs` tạm thời hoặc `NODE_EXTRA_CA_CERTS`).

---

### MySQL local (tùy chọn)

2. Cài MySQL 8.x và tạo database:

```sql
CREATE DATABASE talenthub CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'talenthub'@'localhost' IDENTIFIED BY 'mat_khau_manh';
GRANT ALL PRIVILEGES ON talenthub.* TO 'talenthub'@'localhost';
FLUSH PRIVILEGES;
```

## 2. Clone và dependencies

```bash
cd d:\TalentHub
npm install
```

## 3. Biến môi trường

```bash
copy apps\api\.env.example apps\api\.env
copy apps\web\.env.example apps\web\.env.local
```

Ví dụ `DATABASE_URL`:

```
mysql://talenthub:mat_khau_manh@localhost:3306/talenthub
```

Đặt `JWT_ACCESS_SECRET` và `JWT_REFRESH_SECRET` (chuỗi dài, ngẫu nhiên).

**Gemini AI (Phase 6):** trong `apps/api/.env`:

```env
GEMINI_API_KEY=<API key từ Google AI Studio>
GEMINI_MODEL=gemini-2.0-flash
```

Không commit key lên git. Nếu thiếu key, endpoint `/ai/*` trả 503.

**Cloudinary (Phase 8):**

```env
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

## 4. Migration và seed

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

Migration ban đầu nằm tại `apps/api/prisma/migrations/20251011100000_init/`.

## 5. Chạy ứng dụng

Terminal 1:

```bash
npm run dev:api
```

Terminal 2:

```bash
npm run dev:web
```

- Frontend: http://localhost:3000  
- API health: http://localhost:4000/api/v1/health  
- Swagger: http://localhost:4000/api/docs  

## 6. Super Admin (development)

Sau seed, dùng email/mật khẩu từ `SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD` trong `.env` (mặc định trong `.env.example` chỉ cho dev).

**Production:** đặt mật khẩu mạnh qua biến môi trường, không dùng giá trị mẫu.

## 7. Lỗi thường gặp

| Lỗi | Cách xử lý |
|-----|------------|
| `P1000 Authentication failed` | Kiểm tra user/password MySQL trong `DATABASE_URL` |
| API không start — env invalid | Đủ các biến bắt buộc trong `apps/api/.env` |
| Trang chủ báo không kết nối API | Chạy `npm run dev:api`, kiểm tra `NEXT_PUBLIC_API_URL` |
