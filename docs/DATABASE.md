# TalentHub — Mô tả cơ sở dữ liệu

MySQL 8.x, quản lý bằng Prisma (`apps/api/prisma/schema.prisma`). Thiết kế tham chiếu tài liệu nội bộ và SRS TalentHub.

## Tổng quan (29 bảng)

| Nhóm | Bảng |
|------|------|
| Tài khoản | `users`, `student_profiles`, `company_profiles`, `staff_profiles`, `refresh_tokens` |
| Tuyển dụng | `categories`, `jobs`, `job_status_history`, `applications`, `saved_jobs` |
| CV & AI | `cv_templates`, `cvs`, `cv_versions`, `cv_ai_analyses` |
| Thanh toán | `pricing_plans`, `orders`, `order_items`, `payment_transactions`, `company_posting_quotas` |
| Media | `media_assets` |
| Nhắn tin | `conversations`, `conversation_members`, `messages` |
| Thông báo | `notifications`, `reviews` |
| Kiểm duyệt | `user_reports`, `moderation_logs` |
| Quản trị | `expenses`, `audit_logs` |

## Quy ước

- Khóa chính: `BIGINT` auto-increment, map snake_case trong MySQL.
- Tiền tệ: `DECIMAL(15,2)`.
- Xóa mềm: `deleted_at` trên `users`, `jobs`, `cvs`, `media_assets`, `messages`.
- **Không** cascade xóa đơn hàng, giao dịch, ứng tuyển, audit.

## Quan hệ quan trọng

- Mọi tin tuyển dụng: `jobs.company_id` → `company_profiles.company_id` (không dùng `employer_id`).
- Ứng tuyển: `UNIQUE(job_id, student_user_id)`; `cv_version_id` cố định tại thời điểm nộp.
- Quota: một dòng `company_posting_quotas` / công ty (`free_post_limit` mặc định 3).
- Trường bổ sung `jobs.quota_consumed`: đánh dấu tin đã tiêu thụ lượt miễn phí (tránh trừ hai lần).

## Trạng thái `jobs.status`

`DRAFT` → `PENDING` → `APPROVED` | `REJECTED`; vận hành: `PAUSED`, `CLOSED`, `EXPIRED`, `REMOVED`.

## Index chính

- `jobs`: `(status, job_type, published_at)`, `company_id`, `expires_at`
- `applications`: `student_user_id`
- `notifications`: `(user_id, is_read)`
- `messages`: `(conversation_id, sent_at)`

## Migration

```bash
npm run db:migrate
```

File SQL khởi tạo: `apps/api/prisma/migrations/20251011100000_init/migration.sql`.

## Seed

Danh mục nghề, bảng giá mẫu, template CV, Super Admin (qua `SUPER_ADMIN_*` env).
