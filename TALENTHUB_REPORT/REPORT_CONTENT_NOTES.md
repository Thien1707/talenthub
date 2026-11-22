# Ghi chú báo cáo — Cần sinh viên xác nhận

## Báo cáo Word (phiên bản 2.0)

- Sinh lại: `python TALENTHUB_REPORT/scripts/generate_report.py`
- File chính: `TALENTHUB_Chuyen_De_Tot_Nghiep_2.docx`
- Bản giữa kỳ (cùng nội dung mở rộng): `Bao_Cao_Tien_Do_Giua_Ky_Chuyen_De_2.docx`
- Bám: PDF giữa kỳ nhóm, DATN tham khảo hình thức, SRS Excel (Actor cập nhật trong Word Phụ lục E)

## Thông tin chưa có trong PDF template

- **Tên đề tài đăng ký chính thức** trên trang bìa PDF mẫu vẫn là placeholder «TÊN ĐỀ TÀI». Báo cáo dùng đề xuất: *XÂY DỰNG NỀN TẢNG TUYỂN DỤNG TRỰC TUYẾN TALENTHUB* — cần thống nhất với GVHD.
- **Lời cảm ơn** chi tiết, **chữ ký**, **ngày tháng** trên Lời cảm ơn / Cam đoan.
- **Tiến độ 10 buổi/sprint** theo đề cương — điền bảng thực tế nhóm.
- **Phân công công việc** từng thành viên (MSSV đã có trong template).
- **URL repository GitHub** công khai (ví dụ `Thien1707/talenthub`).
- **Kết quả kiểm thử** đầy đủ — nhiều testcase trong Word đánh dấu «Chưa kiểm thử».

## Khác biệt đề cương vs sản phẩm

| Đề cương (freelance part-time) | TalentHub thực tế |
|-------------------------------|-------------------|
| Spring Boot + React | NestJS + Next.js (monorepo npm) |
| Việc part-time / marketplace gig | `EmploymentType.FULL_TIME` |
| Thanh toán ngoài phạm vi | VNPAY + `CompanyWallet` |
| Chat hướng phát triển | Socket.IO `/chat` đã có |
| Không nêu AI | Gemini — `cv_ai_analyses` |

## Bằng chứng mã nguồn đã dùng

- Schema: `apps/api/prisma/schema.prisma`
- Kế hoạch: `docs/IMPLEMENTATION_PLAN.md`
- Deploy: `docs/DEPLOY_RENDER.md`, `docs/DEPLOY_VERCEL.md`
- API modules: `apps/api/src/*/*.controller.ts`
- Frontend routes: `apps/web/src/app/**/page.tsx`

## Hình vẽ

- **Draw.io:** `TALENTHUB_REPORT/diagrams/*.drawio` (12 file) — xem `diagrams/HUONG_DAN_DRAWIO.md`
- **ERD:** `erd.drawio` sinh bởi `scripts/generate_erd_drawio.py` (bảng PK/FK + chân quạ)
- **PNG:** `diagram_exports/*.png` — export Draw.io (`export_drawio_png.ps1` hoặc thủ công)
- Word: `python scripts/generate_report.py` chèn PNG vào Chương 3–4
- Ảnh UI: chưa chèn — `SCREENSHOT_CHECKLIST.md` → `screenshots/`

## Định dạng Word

- File sinh tự động dùng Heading 1–3; **cập nhật Mục lục / Danh mục hình** trong Word: References → Update Table.
- Kiểm tra lề, Times New Roman 13pt, giãn dòng 1.5 theo template Khoa.

## Bảo mật

- Không đưa `.env`, JWT secret, VNPAY hash secret, Cloudinary secret, DATABASE_URL vào báo cáo.
