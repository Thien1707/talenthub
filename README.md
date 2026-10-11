# TalentHub

Nền tảng tuyển dụng trực tuyến full-stack (Next.js + NestJS + MySQL), hỗ trợ sinh viên, doanh nghiệp, Staff kiểm duyệt và Super Admin.

## Kiến trúc

| Thành phần | Công nghệ |
|------------|-----------|
| Frontend | Next.js 15 (App Router), TypeScript, Tailwind CSS |
| Backend | NestJS 11, REST `/api/v1`, Swagger tại `/api/docs` |
| Database | MySQL 8.x, Prisma ORM |
| Tích hợp (theo phase) | Cloudinary, VNPAY Sandbox, Google Gemini |

Monorepo npm workspaces:

- `apps/web` — giao diện người dùng
- `apps/api` — API và nghiệp vụ

## Yêu cầu

- Node.js ≥ 20
- MySQL 8.x
- Tài khoản Cloudinary / Gemini / VNPAY (khi triển khai các phase tương ứng)

## Cài đặt nhanh

```bash
cd d:\TalentHub
npm install
```

Sao chép biến môi trường:

```bash
copy apps\api\.env.example apps\api\.env
copy apps\web\.env.example apps\web\.env.local
```

Chỉnh `DATABASE_URL` và secret JWT trong `apps/api/.env`.

Database:

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

Chạy dev:

```bash
npm run dev:api   # http://localhost:4000 — Swagger: /api/docs
npm run dev:web   # http://localhost:3000
```

Kiểm tra:

```bash
npm run build:api
npm run build:web
npm run test:api
```

Chi tiết: [docs/SETUP.md](docs/SETUP.md) · Schema: [docs/DATABASE.md](docs/DATABASE.md) · Kế hoạch: [docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md)

## Vai trò

`STUDENT` · `COMPANY` · `STAFF` · `SUPER_ADMIN` — Super Admin được tạo qua seed/bootstrap, không đăng ký công khai.

## Lưu ý bảo mật

Không commit file `.env`. Không đưa API key, JWT secret hoặc VNPAY hash secret vào mã nguồn.
"# talenthub" 
