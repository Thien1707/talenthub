# TalentHub — Security notes

- **JWT access** ngắn hạn; refresh HttpOnly cookie, rotate on refresh.
- **CV / tệp riêng tư**: không dùng `secure_url` công khai làm authorization; dùng `GET /media/:id/signed-url` sau khi backend kiểm tra quyền (owner, công ty có application, thành viên chat).
- **VNPAY IPN**: xác thực chữ ký; bỏ qua fulfill nếu payment đã `SUCCESS`.
- **Staff / Super Admin**: RBAC `RolesGuard`; thao tác nhạy cảm ghi `audit_logs` / `moderation_logs`.
- **SMTP**: không commit `SMTP_PASS`; production bật TLS (port 587/465).
- Không ghi mật khẩu, token, khóa API vào log hoặc audit.
