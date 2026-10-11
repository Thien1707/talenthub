# TalentHub — Kế hoạch triển khai

Trạng thái cập nhật: Phase 1–2 đang triển khai.

## Phase 1: Repository, kiến trúc, cấu hình môi trường

- [x] Monorepo npm workspaces (`apps/api`, `apps/web`)
- [x] NestJS API — prefix `/api/v1`, Swagger, Helmet, CORS, validation
- [x] Next.js App Router — TypeScript strict, Tailwind
- [x] `.env.example` gốc và hướng dẫn cấu hình
- [x] `README.md`, `docs/SETUP.md`
- [x] Git init (tùy chọn local — chưa init root)
- [x] Lint/test pipeline root scripts

## Phase 2: MySQL, schema, migrations, seed

- [x] Prisma schema 28+ bảng nghiệp vụ (+ refresh_tokens, `jobs.quota_consumed`)
- [x] Migration MySQL (SQL trong repo; `migrate dev` cần MySQL credentials hợp lệ)
- [x] `docs/DATABASE.md`
- [x] Seed: categories, pricing, cv_templates, super admin bootstrap
- [ ] Kiểm tra `prisma migrate` + `prisma db seed` trên MySQL local (P1000 trên máy dev hiện tại)

## Phase 3: Authentication & accounts

- [x] JWT access + refresh (HttpOnly cookie, rotate on refresh)
- [x] Register STUDENT / COMPANY (+ quota mặc định cho company)
- [x] RBAC guards/decorators (JwtAuthGuard, RolesGuard)
- [x] Rate limit auth endpoints (Throttler)
- [x] `/auth/me`
- [x] Đổi mật khẩu (`POST /auth/change-password`, UI `/cai-dat/mat-khau`)
- [x] Email verification (JWT token, `/auth/verify-email`, UI banner + `/xac-thuc-email`)
- [x] Frontend đăng ký/đăng nhập (RHF + Zod + axios, refresh cookie)

## Phase 4: Profiles, jobs

- [x] Student / company profiles (GET/PATCH me)
- [x] Categories (public list + SUPER_ADMIN CRUD)
- [x] Jobs workflow (draft → submit/quota → pending → staff approve/reject)
- [x] UI: việc làm công khai, công ty quản lý tin, staff duyệt
- [x] Company profile UI (`/cong-ty/ho-so`), pause/close tin
- [ ] Lịch sử moderation đầy đủ trên UI

## Phase 5: Applications, CV

- [x] CV API (templates, tạo/sửa version), UI `/sinh-vien/cv`
- [x] Applications + saved jobs API; UI ứng tuyển + `/sinh-vien/ung-tuyen`
- [x] CV Builder (multi-section UI), export PDF API + Tải PDF
- [x] Upload CV file PDF lên Cloudinary (UPLOAD source, authenticated)

## Phase 6: Gemini AI

- [x] AiModule (`GeminiService`), lưu `cv_ai_analyses`
- [x] API: general / job-match, quyền sinh viên & công ty (ứng viên đã nộp)
- [x] UI: `/sinh-vien/cv` (Gemini), công ty xem/chạy AI trên ứng viên
- [x] Gemini tích hợp (đã có Phase 6)
- [x] Hàng đợi async (EventEmitter), cache phân tích trùng cv_version + job

## Phase 7: Pricing, quota, VNPAY

- [x] Quota 3 tin miễn phí (transaction) — đã có từ Phase 4
- [x] Orders + VNPAY create/return/ipn (cần `VNPAY_*` trong `.env`)
- [x] Kiểm thử IPN idempotent (Jest mock + Playwright IPN khi có E2E_VNP_TXN_REF)

## Phase 8: Cloudinary, messaging, notifications

- [x] MediaModule (`POST /media/upload`, Cloudinary)
- [x] Conversations/messages API (APPLICATION chat)
- [x] Notifications API + bell UI; tự tạo khi ứng tuyển / đổi trạng thái / tin nhắn
- [x] DIRECT chat API, WebSocket namespace `/chat`
- [x] Presence, typing indicators (WebSocket)

## Phase 9: Staff moderation & Super Admin

- [x] Báo cáo vi phạm (`/reports`, staff queue, UI `/bao-cao`, `/staff/bao-cao`)
- [x] `GET /moderation/logs`, xác minh công ty, moderation log khi xử lý
- [x] Dashboard Staff `/staff/tong-quan`, Super Admin `/admin/tong-quan`, chi phí API cơ bản
- [x] UI/API Staff, reviews moderation, expense DRAFT→PENDING→APPROVED→PAID
- [ ] Staff chỉnh sửa profile / phân quyền chi tiết

## Phase 10: Integration, security, UI polish, docs

- [x] Test IPN idempotent (`payments.service.spec.ts`), `docs/API.md`, `docs/SECURITY.md`
- [x] Email production (SMTP / `MailService`)
- [x] E2E Playwright (smoke + IPN); mở rộng flow đăng nhập/ứng tuyển sau

---

## Giả định nghiệp vụ (quota)

**Lượt miễn phí được trừ khi:** công ty **gửi tin để kiểm duyệt** (chuyển từ `DRAFT` → `PENDING`) với `job_type = NORMAL` và tin **chưa** được đánh dấu đã dùng quota cho job đó. Tin VIP hoặc tin trả phí: quota miễn phí không áp dụng; cần `is_paid = true` (hoặc miễn phí quota) trước khi duyệt công khai.

**Draft:** không trừ quota.
