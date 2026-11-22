# -*- coding: utf-8 -*-
"""Nội dung mở rộng báo cáo — bám SRS Excel + mã nguồn TalentHub."""
from __future__ import annotations

from docx import Document

# Import helpers from generate_report at runtime to avoid circular import issues
# Functions receive add_* callables from parent module


def section_srs_alignment(doc: Document, add_heading, add_para, add_table) -> None:
    add_heading(doc, "3.3. Bài toán và mục tiêu (đối chiếu SRS)", 2)
    add_para(
        doc,
        "Tài liệu SRS ban đầu (Copy of SRS_TaiLieuDacTaYeuCau.xlsx) mô tả marketplace freelance/part-time "
        "với ba vai trò SV–NTD–QTV. Trong quá trình triển khai, nhóm chuyển sang nền tảng tuyển dụng trực tuyến "
        "TalentHub (full-time), tách rõ nhân viên vận hành (STAFF) và quản trị hệ thống (SUPER_ADMIN). "
        "Phần dưới cập nhật Actor và truy vết yêu cầu theo hệ thống đang chạy (apps/api, apps/web).",
    )

    add_heading(doc, "3.4. Tác nhân hệ thống (Actor) — cập nhật theo triển khai", 2)
    add_para(
        doc,
        "Bảng 3.1 thay thế sheet «Actor» trong SRS (chưa cập nhật Superadmin/QTV tách biệt). "
        "Mã vai trò trong CSDL: enum UserRole (Prisma).",
        indent=False,
    )
    add_table(
        doc,
        ["Actor", "UserRole / trạng thái", "Mô tả", "Quyền chính (thực tế trên web)"],
        [
            [
                "Khách (Guest)",
                "—",
                "Chưa đăng nhập",
                "Xem trang chủ, /viec-lam (tìm kiếm, chi tiết tin APPROVED), /dang-ky, /dang-nhap",
            ],
            [
                "Ứng viên (SV)",
                "STUDENT",
                "Sinh viên / người tìm việc",
                "Hồ sơ /sinh-vien/ho-so; CV builder & upload /sinh-vien/cv; ứng tuyển; /sinh-vien/ung-tuyen; "
                "lưu tin; chat /tin-nhan; thông báo; AI CV",
            ],
            [
                "Nhà tuyển dụng (NTD)",
                "COMPANY",
                "Doanh nghiệp đăng tin",
                "Hồ sơ /cong-ty/ho-so; CRUD tin /cong-ty/tin-tuyen-dung; đăng tin + gói quảng bá; "
                "ví /cong-ty/vi-tien; VNPAY; xem CV ứng viên; cập nhật ApplicationStatus; chat; AI job-match",
            ],
            [
                "Nhân viên vận hành",
                "STAFF",
                "Kiểm duyệt, moderation",
                "Duyệt tin /staff/tin-cho-duyet; xác minh công ty /staff/cong-ty-xac-minh; "
                "báo cáo /staff/bao-cao; đánh giá /staff/danh-gia; nhật ký /staff/nhat-ky; dashboard /staff/tong-quan",
            ],
            [
                "Quản trị hệ thống",
                "SUPER_ADMIN",
                "Cấu hình nền tảng",
                "Tài khoản /admin/tai-khoan; nhân viên /admin/nhan-vien; bảng giá /admin/bang-gia; "
                "chi phí /admin/chi-phi; tổng quan /admin/tong-quan; danh mục (API categories)",
            ],
            [
                "Hệ thống",
                "—",
                "Tự động",
                "JwtAuthGuard/RolesGuard; gửi notification; JobStatusHistory; xử lý IPN VNPAY; EventEmitter AI/chat",
            ],
        ],
    )

    add_heading(doc, "3.5. Truy vết yêu cầu SRS → TalentHub", 2)
    add_table(
        doc,
        ["Mã SRS", "Nội dung SRS (tóm tắt)", "TalentHub (mã nguồn)", "Ghi chú"],
        [
            ["FR-01", "Đăng ký/đăng nhập, phân quyền", "auth module, 4 role", "Argon2; refresh cookie; email verify"],
            ["FR-02", "NTD đăng/quản lý tin", "jobs + company", "JobStatus, quota, VIP, promotion"],
            ["FR-03", "Tìm kiếm/lọc tin", "GET jobs public", "Keyword, category; chỉ tin APPROVED"],
            ["FR-04", "Ứng tuyển + theo dõi", "applications, saved-jobs", "Snapshot cvVersionId; WITHDRAWN status"],
            ["FR-05", "NTD duyệt ứng viên", "applications.service", "REVIEWING…REJECTED pipeline"],
            ["FR-06", "Trạng thái công việc part-time", "JobStatus enum", "Khác SRS: DRAFT→PENDING→APPROVED… không OPEN/FILLED gig"],
            ["FR-07", "Đánh giá hai chiều sau hoàn thành", "reviews module", "Có schema; luồng gig chưa như SRS"],
            ["FR-08", "Thông báo", "notifications", "Bell UI + API"],
            ["FR-09", "QTV quản lý", "admin + moderation", "Tách STAFF vs SUPER_ADMIN"],
            ["—", "VNPAY, chat, AI", "payments, conversations, ai", "Mở rộng ngoài SRS gốc"],
        ],
    )

    add_heading(doc, "3.6. Quy tắc nghiệp vụ (đối chiếu SRS BR)", 2)
    add_table(
        doc,
        ["Mã", "Quy tắc (TalentHub thực tế)", "Cơ sở triển khai"],
        [
            ["BR-TH01", "Mỗi SV chỉ một Application cho một Job", "@@unique([jobId, studentUserId])"],
            ["BR-TH02", "Chỉ ứng tuyển tin APPROVED, còn hạn (expiresAt)", "applications.service validation"],
            ["BR-TH03", "Chỉ NTD sở hữu tin mới quản lý ứng viên tin đó", "companyId + job ownership check"],
            ["BR-TH04", "Tin công khai phải qua STAFF (PENDING→APPROVED/REJECTED)", "moderation + JobStatusHistory"],
            ["BR-TH05", "CV nộp kèm đơn là snapshot CvVersion", "Application.cvVersionId; Cv soft-delete"],
            ["BR-TH06", "Quota miễn phí trừ khi gửi tin NORMAL lên PENDING", "IMPLEMENTATION_PLAN + CompanyPostingQuota"],
            ["BR-TH07", "CV file private; truy cập qua auth/preview API", "MediaAsset + media.controller preview"],
        ],
    )

    add_heading(doc, "3.7. Máy trạng thái tin tuyển dụng và hồ sơ", 2)
    add_para(
        doc,
        "SRS sheet «Trạng thái» mô tả OPEN/FILLED/COMPLETED cho gig part-time. "
        "TalentHub dùng JobStatus và ApplicationStatus trong schema.prisma như bảng 3.2 và 3.3.",
        indent=False,
    )
    add_table(
        doc,
        ["Đối tượng", "Trạng thái (enum)", "Ý nghĩa"],
        [
            ["Job", "DRAFT", "NTD soạn tin, chưa gửi duyệt"],
            ["Job", "PENDING", "Chờ STAFF duyệt"],
            ["Job", "APPROVED", "Hiển thị công khai /viec-lam"],
            ["Job", "REJECTED / PAUSED / CLOSED / EXPIRED / REMOVED", "Kết thúc hoặc ẩn theo nghiệp vụ"],
            ["Application", "SUBMITTED → REVIEWING → SHORTLISTED → INTERVIEW → OFFERED → HIRED", "Pipeline tuyển dụng"],
            ["Application", "REJECTED / WITHDRAWN", "Từ chối hoặc ứng viên rút"],
        ],
    )


def section_use_case_catalog(doc: Document, add_heading, add_para, add_table) -> None:
    add_heading(doc, "3.8. Danh sách Use case (rút gọn)", 2)
    add_table(
        doc,
        ["Mã", "Tên", "Actor chính", "Triển khai"],
        [
            ["UC01", "Đăng ký / Đăng nhập / Refresh", "Guest, SV, NTD, STAFF, ADMIN", "✓ /dang-ky, /dang-nhap"],
            ["UC02", "Phân quyền RBAC", "Hệ thống", "✓ Guards + @Roles"],
            ["UC03", "Quản lý hồ sơ SV", "STUDENT", "✓ /sinh-vien/ho-so"],
            ["UC04", "Quản lý hồ sơ công ty", "COMPANY", "✓ /cong-ty/ho-so"],
            ["UC05", "Tạo / sửa / đăng tin", "COMPANY", "✓ /cong-ty/tin-tuyen-dung/*"],
            ["UC06", "Tìm kiếm việc làm", "Guest, STUDENT", "✓ /viec-lam"],
            ["UC07", "Nộp hồ sơ ứng tuyển", "STUDENT", "✓ ApplyJobPanel + API"],
            ["UC08", "NTD xử lý hồ sơ", "COMPANY", "✓ Trên tin + applications API"],
            ["UC09", "Staff duyệt tin", "STAFF", "✓ /staff/tin-cho-duyet"],
            ["UC10", "Nạp ví VNPAY", "COMPANY", "✓ /cong-ty/vi-tien, /thanh-toan/ket-qua"],
            ["UC11", "Chat realtime", "STUDENT, COMPANY", "✓ /tin-nhan + Socket.IO"],
            ["UC12", "Phân tích CV AI", "STUDENT, COMPANY", "✓ Gemini CvAiAnalysis"],
            ["UC13", "Quản trị hệ thống", "SUPER_ADMIN", "✓ /admin/*"],
        ],
    )

    add_heading(doc, "3.8.1. Đặc tả Use case UC01 (Đăng ký / Đăng nhập)", 3)
    add_table(
        doc,
        ["Mục", "Nội dung"],
        [
            ["Actor", "Guest; User các role sau khi đăng nhập"],
            ["Tiền điều kiện", "Email chưa dùng (đăng ký); tài khoản ACTIVE (đăng nhập)"],
            [
                "Luồng đăng ký",
                "1. Chọn vai trò STUDENT hoặc COMPANY tại /dang-ky.\n"
                "2. Nhập thông tin (DTO validation).\n"
                "3. API tạo User + profile tương ứng; gửi email xác thực nếu cấu hình SMTP.\n"
                "4. Chuyển đăng nhập.",
            ],
            [
                "Luồng đăng nhập",
                "1. POST /auth/login.\n2. Trả accessToken + Set-Cookie refresh.\n"
                "3. Frontend lưu token; gọi /auth/me.\n4. POST /auth/refresh khi hết hạn access.",
            ],
            ["Ngoại lệ", "401 sai mật khẩu; 403 role; tài khoản SUSPENDED/BANNED"],
        ],
    )


def section_ch1_sprint(doc: Document, add_heading, add_para, add_table) -> None:
    add_heading(doc, "1.6. Tiến độ thực hiện (đối chiếu kế hoạch Sprint SRS)", 2)
    add_para(
        doc,
        "Bảng 1.2 ánh xạ sprint trong SRS với IMPLEMENTATION_PLAN.md và tiến độ giữa kỳ (tháng 11/2026). "
        "[CẦN SINH VIÊN XÁC NHẬN ngày cụ thể từng buổi học.]",
    )
    add_table(
        doc,
        ["Sprint", "Buổi (SRS)", "Nội dung", "Trạng thái TalentHub"],
        [
            ["Sprint 0", "1–3", "SRS, backlog, phân tích", "✓ SRS Excel + báo cáo; điều chỉnh phạm vi"],
            ["Sprint 1", "4–5", "Kiến trúc, ERD, wireframe", "✓ ERD draw.io, sơ đồ Draw.io, monorepo"],
            ["Sprint 2", "6", "Auth, hồ sơ", "✓ Phase 3–4 IMPLEMENTATION_PLAN"],
            ["Sprint 3", "7", "Tin, tìm kiếm, ứng tuyển", "✓ Phase 4–5"],
            ["Sprint 4", "8", "Duyệt ứng viên, kiểm thử", "✓ Applications pipeline; test một phần"],
            ["Sprint 5", "9–10", "Thông báo, deploy, báo cáo", "✓ VNPAY/chat/AI/admin; Vercel/Render; báo cáo Word"],
        ],
    )


def section_ch2_similar(doc: Document, add_heading, add_para, add_table) -> None:
    add_heading(doc, "2.12. Thực trạng sản phẩm tương tự", 2)
    add_table(
        doc,
        ["Nền tảng", "Điểm mạnh", "Khoảng trống TalentHub hướng tới"],
        [
            ["VietnamWorks, CareerBuilder", "Thương hiệu lớn, nhiều tin", "Tập trung SV, CV builder/upload + AI tích hợp"],
            ["TopCV", "CV, matching", "Liên kết trực tiếp NTD–SV trong một hệ thống nhóm phát triển"],
            ["Facebook groups", "Miễn phí", "Thiếu quy trình, kiểm duyệt, thanh toán minh bạch"],
        ],
    )
    add_para(
        doc,
        "TalentHub không cạnh tranh quy mô với sàn quốc gia mà làm sản phẩm học thuật end-to-end: "
        "phân quyền, moderation, thanh toán, chat và triển khai cloud có kiểm soát.",
    )


def section_ch4_functions(doc: Document, add_heading, add_para, add_table) -> None:
    add_heading(doc, "4.4. Danh sách chức năng theo màn hình (thực tế)", 2)
    add_table(
        doc,
        ["Nhóm", "Đường dẫn (Next.js)", "Mô tả"],
        [
            ["Công khai", "/", "Landing TalentHub"],
            ["Công khai", "/viec-lam, /viec-lam/[slug]", "Danh sách & chi tiết tin"],
            ["Auth", "/dang-ky, /dang-nhap, /xac-thuc-email", "Đăng ký, đăng nhập, xác thực email"],
            ["Auth", "/cai-dat/mat-khau", "Đổi mật khẩu"],
            ["STUDENT", "/sinh-vien/ho-so", "Hồ sơ ứng viên"],
            ["STUDENT", "/sinh-vien/cv, /sinh-vien/cv/[cvId]/xem", "Quản lý CV, xem PDF upload"],
            ["STUDENT", "/sinh-vien/ung-tuyen, /sinh-vien/viec-da-luu", "Ứng tuyển & tin đã lưu"],
            ["COMPANY", "/cong-ty/ho-so, /cong-ty/[companyId]", "Hồ sơ & trang công ty"],
            ["COMPANY", "/cong-ty/tin-tuyen-dung/tao, .../dang-tin", "Tạo tin & checkout đăng tin"],
            ["COMPANY", "/cong-ty/vi-tien, /cong-ty/thanh-toan", "Ví & thanh toán"],
            ["Chung", "/tin-nhan", "Chat DIRECT / APPLICATION"],
            ["STAFF", "/staff/tin-cho-duyet, /staff/cong-ty-xac-minh", "Kiểm duyệt"],
            ["STAFF", "/staff/bao-cao, /staff/danh-gia, /staff/nhat-ky", "Báo cáo, review, log"],
            ["ADMIN", "/admin/tai-khoan, /admin/bang-gia, /admin/chi-phi", "Quản trị"],
            ["Thanh toán", "/thanh-toan/ket-qua", "Kết quả redirect VNPAY"],
        ],
    )

    add_heading(doc, "4.4.1. Tiến độ giữa kỳ (tóm tắt báo cáo PDF nhóm)", 3)
    add_para(
        doc,
        "Theo báo cáo tiến độ giữa kỳ: các phase 1–10 trong IMPLEMENTATION_PLAN đã hoàn thành phần lõi; "
        "demo luồng đăng nhập → tìm việc → ứng tuyển → NTD xử lý hồ sơ trên môi trường Vercel/Render; "
        "sơ đồ Use case, sequence, ERD (Draw.io) phục vụ báo cáo cuối kỳ.",
    )

    add_heading(doc, "4.1.1. Yêu cầu phi chức năng (đối chiếu SRS NFR)", 3)
    add_table(
        doc,
        ["Mã SRS", "Yêu cầu", "TalentHub"],
        [
            ["NFR-01", "Băm mật khẩu", "Argon2 (thay BCrypt trong SRS)"],
            ["NFR-02", "JWT + kiểm tra server", "JwtAuthGuard toàn API protected"],
            ["NFR-03", "SQLi/XSS/CORS/HTTPS", "Prisma parameterized; Helmet; CORS env; HTTPS production"],
            ["NFR-05", "Responsive", "Tailwind, mobile-first"],
            ["NFR-06", "Thông báo lỗi tiếng Việt", "DTO messages + UI toast"],
        ],
    )


def section_appendix_srs(doc: Document, add_heading, add_para, add_table) -> None:
    add_heading(doc, "Phụ lục E. Bảng Actor cập nhật (thay sheet SRS)", 2)
    add_para(
        doc,
        "Nhóm giữ file Excel SRS làm tài liệu giai đoạn 1; sheet Actor cần cập nhật thủ công theo Bảng 3.1 "
        "hoặc sao chép bảng dưới đây vào Excel trước nộp cuối kỳ.",
        indent=False,
    )
    add_table(
        doc,
        ["Actor", "Mô tả", "Quyền chính"],
        [
            ["Khách", "Chưa đăng nhập", "Xem tin, tìm kiếm, đăng ký/đăng nhập"],
            ["STUDENT", "Ứng viên", "CV, ứng tuyển, chat, AI, thông báo"],
            ["COMPANY", "NTD", "Tin, ví, VNPAY, duyệt hồ sơ, chat"],
            ["STAFF", "Vận hành", "Duyệt tin, xác minh công ty, moderation"],
            ["SUPER_ADMIN", "Quản trị", "User, giá, danh mục, chi phí"],
            ["Hệ thống", "Tự động", "Guard, notification, payment IPN"],
        ],
    )
