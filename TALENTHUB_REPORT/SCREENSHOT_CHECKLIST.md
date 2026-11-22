# Checklist chụp màn hình — Báo cáo TalentHub

Chụp trên **production** (`talenthub-gray.vercel.app`) hoặc local đã cấu hình API.  
Độ phân giải khuyến nghị: ≥ 1280px chiều ngang. Lưu vào `TALENTHUB_REPORT/screenshots/` rồi chèn vào Word mục 4.4.

| ID | Chương | Chức năng | Vai trò | URL / Hành động | Chú thích hình |
|----|--------|-----------|---------|-----------------|----------------|
| H01 | 4.4 | Trang chủ | Khách | `/` | Giao diện landing TalentHub |
| H02 | 4.4 | Đăng ký | Khách | `/dang-ky` | Form đăng ký sinh viên/NTD |
| H03 | 4.4 | Đăng nhập | SV | `/dang-nhap` | Form đăng nhập |
| H04 | 4.4 | Danh sách việc | SV | `/viec-lam?keyword=` | Tìm kiếm + kết quả |
| H05 | 4.4 | Chi tiết tin | SV | `/viec-lam/[slug]` | Mô tả + panel ứng tuyển |
| H06 | 4.4 | Chọn CV ứng tuyển | SV | Tab CV builder / upload trên H05 | ApplyJobPanel |
| H07 | 4.4 | Quản lý CV | SV | `/sinh-vien/cv` | Builder + upload |
| H08 | 4.4 | Xem CV upload | SV | `/sinh-vien/cv/[id]/xem` | PDF preview |
| H09 | 4.4 | Phân tích AI CV | SV | `/sinh-vien/cv/[id]?jobId=` | Tab AI |
| H10 | 4.4 | Hồ sơ ứng viên | SV | `/sinh-vien/ho-so` | |
| H11 | 4.4 | Ứng tuyển của tôi | SV | `/sinh-vien/ung-tuyen` | Trạng thái hồ sơ |
| H12 | 4.4 | Việc đã lưu | SV | `/sinh-vien/viec-da-luu` | |
| H13 | 4.4 | Tin nhắn | SV/NTD | `/tin-nhan` | Chat + realtime |
| H14 | 4.4 | Thông báo | SV | Chuông navbar | Dropdown thông báo |
| H15 | 4.4 | Hồ sơ công ty | NTD | `/cong-ty/ho-so` | Logo Cloudinary |
| H16 | 4.4 | Quản lý tin | NTD | `/cong-ty/tin-tuyen-dung` | |
| H17 | 4.4 | Tạo tin | NTD | `/cong-ty/tin-tuyen-dung/tao` | |
| H18 | 4.4 | Đăng tin + gói | NTD | `.../[jobId]/dang-tin` | Checkout quảng bá |
| H19 | 4.4 | Ví công ty | NTD | `/cong-ty/vi-tien` | Số dư + lịch sử |
| H20 | 4.4 | VNPAY kết quả | NTD | `/thanh-toan/ket-qua` | Sau redirect |
| H21 | 4.4 | Ứng viên / CV | NTD | Panel ứng viên trên tin | Xem CV đã nộp |
| H22 | 4.4 | Duyệt tin | STAFF | `/staff/tin-cho-duyet` | Approve/Reject |
| H23 | 4.4 | Xác minh công ty | STAFF | `/staff/cong-ty-xac-minh` | |
| H24 | 4.4 | Admin tài khoản | SUPER_ADMIN | `/admin/tai-khoan` | |
| H25 | 4.4 | Admin bảng giá | SUPER_ADMIN | `/admin/bang-gia` | |
| H26 | 4.4 | Swagger API | Dev | `https://[api]/api/docs` | Không chụp secret |
