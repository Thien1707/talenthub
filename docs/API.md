# TalentHub API (tóm tắt)

Base URL: `http://localhost:4000/api/v1` · Swagger: `/api/docs`

## Nhóm chính

| Nhóm | Mô tả |
|------|--------|
| `auth` | Đăng ký, login, refresh, verify email (SMTP) |
| `jobs` | Tin tuyển dụng, moderation staff |
| `cvs` | CV builder, `GET .../export/pdf` |
| `applications` | Ứng tuyển |
| `ai` | Gemini phân tích CV |
| `media` | Cloudinary upload, `GET .../signed-url` |
| `conversations` | APPLICATION + **DIRECT**, WebSocket `/chat` |
| `reports` / `reviews` | Báo cáo & đánh giá (staff duyệt) |
| `admin` | Staff CRUD, expense workflow, dashboard |
| `payments` | VNPAY (IPN idempotent khi đã SUCCESS) |

## WebSocket chat

- Namespace: `{API_ORIGIN}/chat`
- Handshake: `auth.token` = JWT access
- Event `join` → `conversationId`
- Server emit `message` khi có tin mới
