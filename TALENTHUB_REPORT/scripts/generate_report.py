# -*- coding: utf-8 -*-
"""Sinh báo cáo Word Chuyên đề tốt nghiệp 2 — TalentHub."""
from __future__ import annotations

import sys
from datetime import date
from pathlib import Path

try:
    from docx import Document
    from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_LINE_SPACING
    from docx.shared import Cm, Pt
except ImportError:
    import subprocess

    subprocess.check_call([sys.executable, "-m", "pip", "install", "python-docx", "-q"])
    from docx import Document
    from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_LINE_SPACING
    from docx.shared import Cm, Pt

ROOT = Path(__file__).resolve().parents[1]
DIAGRAM_EXPORTS = ROOT / "diagram_exports"
OUT_DOCX = ROOT / "TALENTHUB_Chuyen_De_Tot_Nghiep_2.docx"
OUT_DOCX_MID = ROOT / "Bao_Cao_Tien_Do_Giua_Ky_Chuyen_De_2.docx"

TITLE_VI = "XÂY DỰNG NỀN TẢNG TUYỂN DỤNG TRỰC TUYẾN TALENTHUB"
TITLE_EN = "DESIGN AND DEVELOPMENT OF THE TALENTHUB ONLINE RECRUITMENT PLATFORM"

STUDENTS = [
    "NGUYỄN PHẠM QUANG THIỆN - 2374802011250",
    "NGUYỄN ÁI BĂNG NHI - 2374802010368",
    "NGUYỄN HOÀNG CẨM TRÚC - 2374802010526",
]
ADVISOR = "ThS. Nguyễn Văn Trung"


def setup_page(doc: Document) -> None:
    sec = doc.sections[0]
    sec.page_height = Cm(29.7)
    sec.page_width = Cm(21.0)
    sec.top_margin = Cm(2.0)
    sec.bottom_margin = Cm(2.5)
    sec.left_margin = Cm(3.0)
    sec.right_margin = Cm(2.0)


def style_normal(doc: Document) -> None:
    st = doc.styles["Normal"]
    st.font.name = "Times New Roman"
    st.font.size = Pt(13)
    pf = st.paragraph_format
    pf.line_spacing_rule = WD_LINE_SPACING.ONE_POINT_FIVE
    pf.first_line_indent = Cm(1.0)


def add_heading(doc: Document, text: str, level: int) -> None:
    h = doc.add_heading(text, level=level)
    for run in h.runs:
        run.font.name = "Times New Roman"
        run.font.color.rgb = None


def add_para(doc: Document, text: str, bold: bool = False, indent: bool = True) -> None:
    p = doc.add_paragraph()
    run = p.add_run(text)
    run.font.name = "Times New Roman"
    run.font.size = Pt(13)
    run.bold = bold
    pf = p.paragraph_format
    pf.line_spacing_rule = WD_LINE_SPACING.ONE_POINT_FIVE
    if indent:
        pf.first_line_indent = Cm(1.0)


def add_figure(doc: Document, fig_no: str, caption: str, png_name: str) -> None:
    path = DIAGRAM_EXPORTS / png_name
    add_para(doc, f"Hình {fig_no}. {caption}", bold=True, indent=False)
    if path.is_file():
        doc.add_picture(str(path), width=Cm(15))
    else:
        add_para(
            doc,
            f"[Chèn hình từ diagrams/{png_name.replace('.png', '.drawio')} — "
            f"export Draw.io hoặc scripts/export_drawio_png.ps1]",
            indent=False,
        )
    add_para(doc, f"Nguồn: Nhóm thực hiện, {date.today().year}", indent=False)
    doc.add_paragraph()


def add_table(doc: Document, headers: list[str], rows: list[list[str]]) -> None:
    t = doc.add_table(rows=1, cols=len(headers))
    t.style = "Table Grid"
    hdr = t.rows[0].cells
    for i, h in enumerate(headers):
        hdr[i].text = h
    for row in rows:
        cells = t.add_row().cells
        for i, val in enumerate(row):
            cells[i].text = val
    doc.add_paragraph()


def cover_pages(doc: Document) -> None:
    for _ in range(2):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = p.add_run("TRƯỜNG ĐẠI HỌC VĂN LANG\nKHOA CÔNG NGHỆ THÔNG TIN\n\n")
        r.font.name = "Times New Roman"
        r.font.size = Pt(13)
        r.bold = True
        p2 = doc.add_paragraph()
        p2.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r2 = p2.add_run(
            "CHUYÊN ĐỀ TỐT NGHIỆP 2\n"
            "NGÀNH: CÔNG NGHỆ THÔNG TIN (7480201)\n"
            "Chuyên ngành: Công nghệ phần mềm\n\n"
            f"{TITLE_VI}\n\n"
            "SINH VIÊN THỰC HIỆN:\n"
            + "\n".join(STUDENTS)
            + f"\n\nGiảng viên hướng dẫn: {ADVISOR}\n\n"
            "TP. Hồ Chí Minh – Năm 2026"
        )
        r2.font.name = "Times New Roman"
        r2.font.size = Pt(13)
        doc.add_page_break()


def preliminary(doc: Document) -> None:
    add_heading(doc, "LỜI CẢM ƠN", 1)
    add_para(
        doc,
        "Nhóm xin chân thành cảm ơn ThS. Nguyễn Văn Trung — giảng viên hướng dẫn — "
        "đã đồng hành, góp ý chuyên môn trong suốt quá trình phân tích, thiết kế và "
        "triển khai hệ thống TalentHub. Nhóm cũng xin cảm ơn Khoa Công nghệ Thông tin, "
        "Trường Đại học Văn Lang và các thầy cô đã truyền đạt kiến thức nền tảng "
        "giúp nhóm hoàn thành học phần Chuyên đề tốt nghiệp 2.",
    )
    add_para(doc, "[CẦN SINH VIÊN XÁC NHẬN: bổ sung lời cảm ơn cá nhân, chữ ký nhóm trưởng]", indent=False)
    doc.add_page_break()

    add_heading(doc, "LỜI CAM ĐOAN", 1)
    add_para(
        doc,
        "Chúng em xin cam đoan đây là công trình nghiên cứu của nhóm, được thực hiện "
        "dưới sự hướng dẫn khoa học của giảng viên hướng dẫn. Các nội dung, kết quả và "
        "số liệu trình bày trong báo cáo là trung thực; phần trích dẫn đã được ghi "
        "nguồn trong mục Tài liệu tham khảo.",
    )
    doc.add_page_break()

    add_heading(doc, "TÓM TẮT", 1)
    add_para(
        doc,
        "Báo cáo trình bày quá trình phân tích, thiết kế và xây dựng nền tảng tuyển dụng "
        "trực tuyến TalentHub — hệ thống web kết nối ứng viên (sinh viên) với nhà tuyển dụng, "
        "hỗ trợ đăng tin việc làm full-time, quản lý CV (tạo trên nền tảng và tải file), "
        "ứng tuyển trực tuyến, ví doanh nghiệp, thanh toán VNPAY, tin nhắn thời gian thực, "
        "thông báo và phân tích CV bằng Google Gemini. Hệ thống được triển khai theo kiến trúc "
        "client–server: frontend Next.js trên Vercel, backend NestJS trên Render, cơ sở dữ liệu "
        "MySQL qua Prisma ORM, lưu trữ tệp Cloudinary. Kết quả đạt được bao gồm luồng nghiệp vụ "
        "tuyển dụng end-to-end, phân quyền JWT/RBAC, và các module quản trị cho nhân viên vận hành "
        "và quản trị viên. Báo cáo cũng phân tích sự khác biệt giữa đề cương marketplace "
        "freelance part-time ban đầu và phạm vi sản phẩm thực tế đã triển khai.",
    )
    add_para(doc, "Từ khóa: Tuyển dụng trực tuyến; NestJS; Next.js; JWT; MySQL.", indent=False)
    doc.add_page_break()

    add_heading(doc, "Abstract", 1)
    add_para(
        doc,
        "This report presents the analysis, design, and implementation of TalentHub, "
        "an online recruitment platform connecting student candidates with employers. "
        "The system supports full-time job postings, CV builder and file upload, applications, "
        "company wallet and VNPAY payments, real-time messaging, notifications, and Gemini-based "
        "CV analysis. The solution uses a Next.js frontend (Vercel), NestJS API (Render), "
        "MySQL with Prisma, and Cloudinary for private document storage.",
    )
    add_para(doc, "Keywords: Online recruitment; NestJS; Next.js; JWT; MySQL.", indent=False)
    doc.add_page_break()

    add_heading(doc, "MỤC LỤC", 1)
    add_para(
        doc,
        "Trong Microsoft Word: tham chiếu → Mục lục → Tùy chọn Mục lục tự động (Heading 1–3), "
        "sau đó bấm chuột phải Mục lục → Cập nhật trường → Cập nhật toàn bộ. "
        "Trang bìa và phần mở đầu (i, ii, …) cần tách section và đánh số La Mã theo template Khoa nếu GV yêu cầu.",
        indent=False,
    )
    doc.add_page_break()

    add_heading(doc, "DANH MỤC HÌNH VẼ", 1)
    figures = [
        "Hình 3.1. Sơ đồ Use Case tổng quát",
        "Hình 3.2. Hoạt động — Ứng viên nộp hồ sơ",
        "Hình 3.3. Hoạt động — NTD đăng tin",
        "Hình 4.1. Use Case — Ứng viên",
        "Hình 4.2. Use Case — Nhà tuyển dụng",
        "Hình 4.3. Use Case — Quản trị",
        "Hình 4.4. ERD lõi nghiệp vụ (Prisma schema)",
        "Hình 4.5. Kiến trúc triển khai",
        "Hình 4.6. Sequence — Xác thực",
        "Hình 4.7. Sequence — Ứng tuyển",
        "Hình 4.8. Sequence — Thanh toán VNPAY",
        "Hình 4.9. Sequence — Tin nhắn realtime",
        "[Hình 4.10–4.35: ảnh màn hình theo SCREENSHOT_CHECKLIST.md — chèn sau khi chụp]",
    ]
    for f in figures:
        add_para(doc, f, indent=False)
    doc.add_page_break()

    add_heading(doc, "DANH MỤC BẢNG", 1)
    tables = [
        "Bảng 1.1. So sánh đề cương freelance part-time và TalentHub thực tế",
        "Bảng 3.1. Yêu cầu chức năng theo vai trò",
        "Bảng 3.2. Mô tả Use Case — Nộp hồ sơ ứng tuyển",
        "Bảng 4.1. Từ điển dữ liệu — các thực thể chính",
        "Bảng 4.2. Danh sách module API NestJS",
        "Bảng 4.3. Kế hoạch kiểm thử chức năng",
        "Bảng 4.4. Phân công nhóm",
    ]
    for t in tables:
        add_para(doc, t, indent=False)
    doc.add_page_break()

    add_heading(doc, "DANH MỤC TỪ VIẾT TẮT", 1)
    abbr = [
        ("API", "Application Programming Interface — giao diện lập trình ứng dụng"),
        ("CV", "Curriculum Vitae — sơ yếu lý lịch"),
        ("ERD", "Entity Relationship Diagram — sơ đồ thực thể quan hệ"),
        ("JWT", "JSON Web Token — mã thông báo xác thực"),
        ("NTD", "Nhà tuyển dụng"),
        ("ORM", "Object-Relational Mapping — ánh xạ đối tượng–quan hệ"),
        ("RBAC", "Role-Based Access Control — phân quyền theo vai trò"),
        ("REST", "Representational State Transfer — kiến trúc API RESTful"),
        ("SV", "Sinh viên / ứng viên"),
        ("UML", "Unified Modeling Language — ngôn ngữ mô hình hóa thống nhất"),
        ("VNPAY", "Cổng thanh toán VNPAY (tích hợp nạp ví công ty)"),
    ]
    for k, v in abbr:
        add_para(doc, f"{k}: {v}", indent=False)
    doc.add_page_break()

    add_heading(doc, "LỊCH SỬ PHIÊN BẢN BÁO CÁO", 1)
    add_table(
        doc,
        ["Phiên bản", "Ngày", "Người cập nhật", "Mô tả thay đổi"],
        [
            ["0.1", "[CẦN XÁC NHẬN]", "Nhóm", "Khung báo cáo và sơ đồ Mermaid"],
            ["1.0", str(date.today()), "Nhóm", "Bản rút gọn sơ đồ + 5 chương"],
            [
                "2.0",
                str(date.today()),
                "Nhóm",
                "Mở rộng theo SRS Excel, DATN tham khảo, Actor/FR/BR web thực tế",
            ],
        ],
    )
    doc.add_page_break()


def chapter_1(doc: Document) -> None:
    add_heading(doc, "CHƯƠNG 1: MỞ ĐẦU", 1)

    add_heading(doc, "1.1. Lý do chọn đề tài / Tính cấp thiết", 2)
    add_para(
        doc,
        "Thị trường lao động tại Việt Nam chuyển dịch mạnh sang tuyển dụng số: ứng viên tìm việc "
        "qua Internet, nhà tuyển dụng cần kênh đăng tin, sàng lọc hồ sơ và trao đổi trực tiếp. "
        "Sinh viên — nhóm đối tượng chính của TalentHub — cần công cụ tạo CV, nộp hồ sơ minh bạch "
        "và theo dõi trạng thái ứng tuyển. Do đó, xây dựng nền tảng tuyển dụng tập trung vào trải nghiệm "
        "ứng viên và doanh nghiệp vừa và nhỏ là cấp thiết về mặt thực tiễn và phù hợp chuyên ngành "
        "Công nghệ phần mềm.",
    )
    add_para(
        doc,
        "Đề cương học phần ban đầu (GV Nguyễn Văn Trung) đề xuất marketplace freelance/part-time "
        "cho sinh viên với Spring Boot và React. Trong quá trình thực hiện, nhóm phát triển sản phẩm "
        "TalentHub hướng tới tuyển dụng full-time, stack NestJS + Next.js, bổ sung ví, VNPAY, chat "
        "realtime và AI — chi tiết so sánh tại mục 1.3 và Chương 4.7.",
    )

    add_heading(doc, "1.2. Mục tiêu đề tài", 2)
    add_para(doc, "Mục tiêu tổng quát: Xây dựng và triển khai nền tảng web TalentHub hỗ trợ tuyển dụng trực tuyến an toàn, có thể mở rộng.", bold=False)
    goals = [
        "Phân tích yêu cầu và thiết kế CSDL MySQL phản ánh nghiệp vụ tuyển dụng.",
        "Triển khai API REST NestJS với JWT, phân quyền STUDENT/COMPANY/STAFF/SUPER_ADMIN.",
        "Xây dựng giao diện Next.js cho ứng viên, NTD và quản trị.",
        "Tích hợp Cloudinary (CV, logo), VNPAY (nạp ví), Socket.IO (chat), Gemini (phân tích CV).",
        "Triển khai production: Vercel + Render + MySQL.",
    ]
    for g in goals:
        add_para(doc, f"• {g}", indent=False)

    add_heading(doc, "1.3. Đối tượng, phạm vi và khác biệt đề cương", 2)
    add_para(
        doc,
        "Đối tượng nghiên cứu: quy trình tuyển dụng trực tuyến (đăng tin → ứng tuyển → duyệt hồ sơ → trao đổi). "
        "Phạm vi chức năng: theo mã nguồn monorepo `apps/api`, `apps/web` (xem Chương 4). "
        "Phạm vi kỹ thuật: TypeScript, NestJS 11, Next.js 15, Prisma 6, MySQL. "
        "Giới hạn: EmploymentType hiện chỉ FULL_TIME; không có ứng dụng mobile native; "
        "một số hạng mục trong IMPLEMENTATION_PLAN.md vẫn đánh dấu chưa hoàn thiện UI.",
    )
    add_table(
        doc,
        ["Hạng mục", "Đề cương freelance part-time", "TalentHub thực tế"],
        [
            ["Loại việc", "Part-time, gig", "Full-time (enum EmploymentType)"],
            ["Backend", "Spring Boot", "NestJS + Prisma"],
            ["Frontend", "React", "Next.js App Router"],
            ["Thanh toán", "Ngoài phạm vi", "VNPAY + ví công ty"],
            ["Chat", "Hướng phát triển", "Socket.IO đã triển khai"],
            ["AI CV", "Không nêu", "Gemini — cv_ai_analyses"],
        ],
    )

    add_heading(doc, "1.4. Phương pháp nghiên cứu", 2)
    add_para(
        doc,
        "Nhóm kết hợp nghiên cứu lý thuyết (tài liệu REST, JWT, UML), khảo sát hiện trạng, "
        "phân tích hệ thống (use case, ERD), thiết kế kiến trúc, lập trình theo sprint nội bộ, "
        "kiểm thử API/UI và triển khai thử nghiệm trên Vercel/Render.",
    )

    add_heading(doc, "1.5. Cơ sở khoa học và thực tiễn", 2)
    add_para(
        doc,
        "Áp dụng mô hình client–server, thiết kế hướng dịch vụ cho API, ORM Prisma đảm bảo "
        "toàn vẹn dữ liệu (FK, unique application/job+student). Bảo mật: Argon2 hash mật khẩu, "
        "JWT access + refresh HttpOnly (SameSite=None khi cross-origin Vercel–Render).",
    )

    from report_extended_content import section_ch1_sprint

    section_ch1_sprint(doc, add_heading, add_para, add_table)

    add_heading(doc, "1.7. Sản phẩm bàn giao", 2)
    add_para(
        doc,
        "Mã nguồn GitHub; hệ thống production (Vercel/Render); báo cáo Word; sơ đồ Draw.io; "
        "SRS Excel (cập nhật Actor); tài liệu docs/SETUP.md, DEPLOY_*.md; Swagger `/api/docs`.",
    )

    add_heading(doc, "1.8. Cấu trúc báo cáo", 2)
    add_para(
        doc,
        "Báo cáo gồm 5 chương theo hướng dẫn Khoa CNTT — Văn Lang và tham khảo hình thức trình bày "
        "đồ án tốt nghiệp (mục lục, danh mục hình/bảng, chương phân tích — thiết kế — kết quả — kết luận). "
        "Nội dung bám tài liệu SRS nhóm và mã nguồn TalentHub hiện tại.",
        indent=False,
    )
    doc.add_page_break()


def chapter_2(doc: Document) -> None:
    add_heading(doc, "CHƯƠNG 2: CƠ SỞ LÝ THUYẾT", 1)

    add_heading(doc, "2.1. Tổng quan hệ thống tuyển dụng trực tuyến", 2)
    add_para(
        doc,
        "Hệ thống tuyển dụng trực tuyến số hóa các bước: đăng tin, tiếp nhận hồ sơ, sàng lọc, phỏng vấn và "
        "trao đổi giữa ứng viên và nhà tuyển dụng. TalentHub được xây dựng theo mô hình nền tảng tuyển dụng "
        "(job board + quản lý ứng tuyển), không phải sàn giao việc freelance theo đề cương ban đầu; "
        "enum EmploymentType trong CSDL hiện chỉ có FULL_TIME.",
    )

    add_heading(doc, "2.2. Khái niệm quản lý tuyển dụng", 2)
    add_para(
        doc,
        "Ứng viên được ánh xạ tài khoản User với role STUDENT và StudentProfile. NTD là User role COMPANY "
        "kèm CompanyProfile (verificationStatus do STAFF duyệt). Tin tuyển dụng (Job) trải qua vòng đời "
        "JobStatus (DRAFT → PENDING → APPROVED …). Hồ sơ ứng tuyển (Application) liên kết jobId, studentUserId "
        "và cvVersionId — bản snapshot CV tại thời điểm nộp, đảm bảo NTD vẫn xem được CV đã nộp khi ứng viên "
        "soft-delete Cv cá nhân (deletedAt).",
    )

    add_heading(doc, "2.3. Phương pháp luận phát triển phần mềm", 2)
    add_para(
        doc,
        "Nhóm áp dụng quy trình lặp: thu thập yêu cầu → mô hình hóa UML → thiết kế CSDL Prisma → triển khai "
        "module API theo domain (jobs, applications, cvs…) → tích hợp frontend Next.js → kiểm thử thủ công và "
        "triển khai cloud. Tài liệu nội bộ IMPLEMENTATION_PLAN.md ghi nhận tiến độ từng hạng mục.",
    )

    add_heading(doc, "2.4. Kiến trúc ứng dụng web", 2)
    add_para(
        doc,
        "TalentHub là SPA/SSR kết hợp: Next.js App Router render trang công khai và khu vực đăng nhập; "
        "state phía client dùng TanStack Query đồng bộ với REST API. Tách biệt presentation (web) và "
        "business logic (api) giúp scale độc lập (Vercel / Render).",
    )

    add_heading(doc, "2.5. Kiến trúc client–server", 2)
    add_para(
        doc,
        "Trình duyệt gọi HTTPS tới API NestJS; xác thực gửi Bearer access token; refresh token lưu HttpOnly cookie "
        "để giảm rủi ro XSS. Production Vercel–Render yêu cầu SameSite=None; Secure cho cookie refresh "
        "(refresh-cookie.util.ts).",
    )

    add_heading(doc, "2.6. RESTful API", 2)
    add_para(
        doc,
        "API version hóa prefix /api/v1; mô tả OpenAPI tại /api/docs (Swagger). Resource-oriented: "
        "jobs, applications, cvs/me, wallet, payments/vnpay, conversations, notifications, admin. "
        "Validation qua class-validator DTO; lỗi chuẩn hóa NestJS exception filter.",
    )

    add_heading(doc, "2.7. Xác thực và phân quyền", 2)
    add_para(
        doc,
        "Mật khẩu băm Argon2. JWT access ngắn hạn; refresh token lưu hash trong refresh_tokens. "
        "Guards: JwtAuthGuard, RolesGuard với decorator @Roles. Bốn vai trò: STUDENT, COMPANY, STAFF, SUPER_ADMIN — "
        "STAFF kiểm duyệt tin/công ty; SUPER_ADMIN cấu hình giá và tài khoản.",
    )

    add_heading(doc, "2.8. Cơ sở dữ liệu quan hệ và MySQL", 2)
    add_para(
        doc,
        "MySQL lưu trữ bền vững; Prisma migrate quản lý schema. Ràng buộc toàn vẹn: @@unique([jobId, studentUserId]) "
        "trên applications; FK Restrict trên application–job để tránh xóa tin còn hồ sơ. Index trên jobs(status, jobType, publishedAt) "
        "phục vụ listing công khai.",
    )

    add_heading(doc, "2.9. Công nghệ giao tiếp thời gian thực", 2)
    add_para(
        doc,
        "Module conversations kết hợp REST (tạo hội thoại, lịch sử tin) với Socket.IO namespace /chat "
        "để push message:new. ConversationType DIRECT và APPLICATION gắn chat theo ứng tuyển.",
    )

    add_heading(doc, "2.10. Thanh toán trực tuyến VNPAY", 2)
    add_para(
        doc,
        "Order/OrderItem mô tả gói đăng tin, nâng VIP, nạp ví (WALLET_TOPUP). PaymentTransaction lưu vnp_txn_ref "
        "unique; callback IPN và return URL cập nhật trạng thái và ghi WalletTransaction DEPOSIT vào CompanyWallet. "
        "Báo cáo không trích dẫn TMN code, hash secret hay URL sandbox/production thật.",
    )

    add_heading(doc, "2.11. Công nghệ và công cụ phát triển TalentHub", 2)
    add_table(
        doc,
        ["Thành phần", "Công nghệ", "Vai trò trong TalentHub"],
        [
            ["Frontend", "Next.js 15, React 19, Tailwind CSS", "UI ứng viên/NTD/admin, routing tiếng Việt"],
            ["Data fetching", "TanStack Query, Axios", "Cache API, interceptor token"],
            ["Backend", "NestJS 11, TypeScript", "REST, guards, modules theo domain"],
            ["CSDL", "MySQL, Prisma 6", "Schema 31 model, migration"],
            ["Lưu trữ", "Cloudinary (raw authenticated)", "CV PDF/DOC, logo, avatar"],
            ["AI", "Google Gemini API", "CvAiAnalysis GENERAL / JOB_MATCH"],
            ["Realtime", "Socket.IO", "Chat /chat"],
            ["Thanh toán", "VNPAY", "Nạp ví, thanh toán đơn hàng"],
            ["Triển khai", "Vercel, Render", "WEB_URL, CORS, env production"],
        ],
    )
    from report_extended_content import section_ch2_similar

    section_ch2_similar(doc, add_heading, add_para, add_table)
    doc.add_page_break()


def chapter_3(doc: Document) -> None:
    add_heading(doc, "CHƯƠNG 3: THỰC TRẠNG VÀ PHÂN TÍCH HỆ THỐNG", 1)

    add_heading(doc, "3.1. Thực trạng tuyển dụng trực tuyến", 2)
    add_para(
        doc,
        "Ứng viên, đặc biệt sinh viên, phải sử dụng nhiều kênh rời rạc (mạng xã hội, group, sàn lớn) "
        "để tìm việc; khó quản lý CV và trạng thái phản hồi. NTD vừa và nhỏ cần kênh đăng tin có kiểm duyệt, "
        "thanh toán minh bạch và công cụ lọc hồ sơ. SRS nhóm xác định bài toán marketplace part-time; "
        "sau khảo sát kỹ thuật, sản phẩm TalentHub tập trung tuyển dụng full-time với moderation và monetization.",
    )

    add_heading(doc, "3.2. Giải pháp TalentHub", 2)
    add_para(
        doc,
        "Ứng viên phải tạo CV rời rạc, khó theo dõi hồ sơ; NTD thiếu công cụ duyệt tin và quản lý ứng viên tập trung. "
        "TalentHub cung cấp một cổng duy nhất: tìm việc `/viec-lam`, CV `/sinh-vien/cv`, ứng tuyển gắn CvVersion, "
        "NTD `/cong-ty/tin-tuyen-dung`, staff `/staff/tin-cho-duyet`.",
    )

    from report_extended_content import (
        section_srs_alignment,
        section_use_case_catalog,
    )

    section_srs_alignment(doc, add_heading, add_para, add_table)
    section_use_case_catalog(doc, add_heading, add_para, add_table)

    add_heading(doc, "3.9. Yêu cầu chức năng theo vai trò (tóm tắt triển khai)", 2)
    add_table(
        doc,
        ["Vai trò", "Chức năng chính (đã có trong mã nguồn)"],
        [
            ["STUDENT", "Auth, hồ sơ, CV builder/upload, tìm việc, lưu tin, ứng tuyển, chat, thông báo, AI CV"],
            ["COMPANY", "Hồ sơ công ty, CRUD tin, đăng tin+quảng bá, ví/VNPAY, xem ứng viên, chat, AI"],
            ["STAFF", "Duyệt tin, xác minh công ty, báo cáo, đánh giá, moderation log"],
            ["SUPER_ADMIN", "Users, staff, pricing, categories, expenses, dashboard"],
        ],
    )

    add_heading(doc, "3.10. Yêu cầu phi chức năng", 2)
    add_table(
        doc,
        ["Nhóm", "Yêu cầu", "Cách đáp ứng trong TalentHub"],
        [
            ["Bảo mật", "Xác thực, phân quyền, bảo vệ CV", "JWT + RBAC; media private; preview API có auth"],
            ["Hiệu năng", "Listing tin nhanh", "Index jobs; phân trang API"],
            ["Tin cậy", "Snapshot CV ứng tuyển", "Application.cvVersionId bất biến"],
            ["Khả dụng", "Truy cập Internet", "Deploy Vercel/Render; health module"],
            ["Sử dụng", "Tiếng Việt, mobile-friendly", "Route /viec-lam, /sinh-vien/*; Tailwind responsive"],
            ["Mở rộng", "Thêm module", "Monorepo npm workspaces apps/web, apps/api"],
            ["Bảo trì", "Schema rõ ràng", "Prisma + Swagger"],
            ["Tương thích", "Trình duyệt hiện đại", "ES2022, không IE"],
        ],
    )

    add_heading(doc, "3.11. Sơ đồ Use case và hoạt động", 2)
    add_figure(doc, "3.1", "Sơ đồ Use Case tổng quát", "use_case_overall.png")
    add_figure(doc, "3.2", "Hoạt động — Ứng viên nộp hồ sơ", "activity_job_application.png")
    add_figure(doc, "3.3", "Hoạt động — NTD đăng tin", "activity_job_posting.png")

    add_heading(doc, "3.12. Mô tả Use Case tiêu biểu (bổ sung)", 2)
    add_para(doc, "Use Case UC-01 — Nộp hồ sơ ứng tuyển", bold=True, indent=False)
    add_table(
        doc,
        ["Mục", "Mô tả"],
        [
            ["Tên", "Nộp hồ sơ ứng tuyển"],
            ["Tác nhân", "Ứng viên (STUDENT)"],
            ["Tiền điều kiện", "Đăng nhập; tin APPROVED; có CvVersion hợp lệ"],
            ["Luồng chính", "Chọn CV → POST /applications → Application SUBMITTED → thông báo NTD"],
            ["Hậu điều kiện", "Application lưu cvVersionId (snapshot); NTD xem CV qua application"],
            ["Ngoại lệ", "Trùng job+student → 400; CV đã soft-delete → 400"],
        ],
    )
    add_para(doc, "Use Case UC-02 — NTD đăng tin và thanh toán", bold=True, indent=False)
    add_table(
        doc,
        ["Mục", "Mô tả"],
        [
            ["Tác nhân", "COMPANY"],
            ["Luồng", "Tạo Job DRAFT → chọn gói / ví → Order → VNPAY hoặc trừ ví → JobPublishRequest → APPROVED (staff)"],
            ["Ràng buộc", "Company verification; quota posting; wallet balance"],
        ],
    )
    add_para(doc, "Use Case UC-03 — STAFF duyệt tin", bold=True, indent=False)
    add_table(
        doc,
        ["Mục", "Mô tả"],
        [
            ["Tác nhân", "STAFF"],
            ["Luồng", "Danh sách PENDING → approve/reject → JobStatusHistory + moderation log"],
        ],
    )

    add_heading(doc, "3.13. Giả định và hạn chế", 2)
    add_para(
        doc,
        "Giả định MySQL và Cloudinary/Gemini/VNPAY cấu hình đúng env production. "
        "Hạn chế: không mô tả chi tiết SLA Render free tier; kiểm thử tự động E2E còn hạn chế.",
    )
    doc.add_page_break()


def chapter_4(doc: Document) -> None:
    add_heading(doc, "CHƯƠNG 4: KẾT QUẢ NGHIÊN CỨU VÀ TRIỂN KHAI", 1)

    add_heading(doc, "4.1. Đặc tả yêu cầu", 2)
    add_para(
        doc,
        "Quy tắc nghiệp vụ tiêu biểu: (1) Application.cvVersionId bất biến — xóa CV cá nhân chỉ set Cv.deletedAt; "
        "(2) Job duyệt bởi STAFF trước khi public; (3) Đăng tin tiêu thụ quota hoặc ví; "
        "(4) Media CV private — truy cập qua JWT hoặc signed URL / preview API.",
    )

    add_heading(doc, "4.2. Phân tích và thiết kế", 2)
    add_figure(doc, "4.1", "Use Case — Ứng viên", "use_case_candidate.png")
    add_figure(doc, "4.2", "Use Case — Nhà tuyển dụng", "use_case_employer.png")
    add_figure(doc, "4.3", "Use Case — Quản trị", "use_case_admin.png")
    erd_png = DIAGRAM_EXPORTS / "erd.png"
    if erd_png.is_file():
        add_figure(doc, "4.4", "ERD lõi nghiệp vụ (MySQL / Prisma)", "erd.png")
    else:
        add_para(
            doc,
            "Hình 4.4. ERD — xuất từ diagrams/erd.drawio (File → Export PNG) vào diagram_exports/erd.png.",
            bold=True,
            indent=False,
        )
        add_para(doc, "Nguồn: generate_erd_drawio.py, schema.prisma", indent=False)
        doc.add_paragraph()
    add_figure(doc, "4.5", "Kiến trúc triển khai", "system_architecture.png")
    add_figure(doc, "4.6", "Sequence — Xác thực", "sequence_authentication.png")
    add_figure(doc, "4.7", "Sequence — Ứng tuyển", "sequence_application.png")
    add_figure(doc, "4.8", "Sequence — Thanh toán VNPAY", "sequence_payment.png")
    add_figure(doc, "4.9", "Sequence — Tin nhắn realtime", "sequence_messaging.png")

    add_heading(doc, "4.3. Thiết kế CSDL", 2)
    add_para(
        doc,
        "CSDL MySQL được mô tả bằng Prisma (`apps/api/prisma/schema.prisma`). "
        "Bảng trung tâm: users, company_profiles, jobs, applications, cvs, cv_versions, media_assets.",
    )
    add_para(doc, "Bảng 4.1. Từ điển dữ liệu — thực thể chính (trích schema.prisma)", bold=True, indent=False)
    add_table(
        doc,
        ["Bảng", "Khóa chính", "Khóa ngoại / ràng buộc", "Mô tả"],
        [
            ["users", "user_id", "role, status index", "Tài khoản đa vai trò"],
            ["student_profiles", "student_profile_id", "user_id unique", "Hồ sơ ứng viên"],
            ["company_profiles", "company_id", "user_id unique; verified_by", "Hồ sơ NTD, xác minh"],
            ["jobs", "job_id", "company_id, category_id", "Tin tuyển dụng, promotion fields"],
            ["applications", "application_id", "UK job+student; cv_version_id", "Hồ sơ ứng tuyển"],
            ["cvs / cv_versions", "cv_id / cv_version_id", "file_asset_id; sourceType", "Builder hoặc upload"],
            ["media_assets", "asset_id", "owner_user_id", "Cloudinary public_id, type CV/LOGO…"],
            ["orders / order_items", "order_id", "company_id", "Đơn đăng tin, topup"],
            ["payment_transactions", "payment_id", "vnp_txn_ref unique", "Trạng thái VNPAY"],
            ["company_wallets", "wallet_id", "company_id unique", "Số dư VND"],
            ["wallet_transactions", "wallet_tx_id", "job_id optional", "DEPOSIT, JOB_PUBLISH…"],
            ["conversations / messages", "conversation_id", "application link", "Chat realtime"],
            ["notifications", "notification_id", "user_id", "Thông báo in-app"],
            ["cv_ai_analyses", "analysis_id", "cv_version_id, job_id?", "Kết quả Gemini"],
        ],
    )

    add_heading(doc, "4.3.1. Module API (controllers)", 3)
    add_table(
        doc,
        ["Module", "Controller", "Chức năng chính"],
        [
            ["auth", "auth.controller", "Đăng ký, đăng nhập, refresh, email verify"],
            ["jobs", "jobs.controller", "CRUD tin, tìm kiếm public, moderation"],
            ["applications", "applications.controller", "Nộp hồ sơ, cập nhật trạng thái (NTD)"],
            ["cvs", "cvs.controller", "Builder, upload, version, soft delete"],
            ["media", "media.controller", "Upload, preview CV authenticated"],
            ["wallet", "wallet.controller", "Số dư, lịch sử giao dịch"],
            ["payments", "payments + vnpay-callback", "Tạo URL thanh toán, IPN"],
            ["conversations", "conversations.controller", "Hội thoại, tin nhắn"],
            ["notifications", "notifications.controller", "Danh sách, đánh dấu đọc"],
            ["ai", "ai.controller", "Phân tích CV Gemini"],
            ["admin", "admin.controller", "Users, staff, pricing, expenses"],
            ["moderation", "moderation.controller", "Staff duyệt tin/công ty"],
            ["saved-jobs", "saved-jobs.controller", "Lưu tin yêu thích"],
            ["reviews / reports", "reviews, reports", "Đánh giá, báo cáo vi phạm"],
        ],
    )

    from report_extended_content import section_ch4_functions

    section_ch4_functions(doc, add_heading, add_para, add_table)

    add_heading(doc, "4.4.2. Mô tả triển khai theo vai trò", 2)
    impl_blocks = [
        (
            "Ứng viên",
            "Trang `/dang-ky`, `/dang-nhap`; CV `/sinh-vien/cv`, upload PDF/DOC/DOCX (`POST /cvs/me/upload`), "
            "xem `/sinh-vien/cv/[id]/xem`; ứng tuyển `ApplyJobPanel`; `/sinh-vien/ung-tuyen`; "
            "`/viec-lam` tìm kiếm keyword; `/sinh-vien/viec-da-luu`; chat `/tin-nhan`.",
        ),
        (
            "Nhà tuyển dụng",
            "`/cong-ty/ho-so`; tin `/cong-ty/tin-tuyen-dung`, checkout gói quảng bá; "
            "ví `/cong-ty/vi-tien`; xem CV ứng viên `ApplicantCvViewer`; AI trên hồ sơ.",
        ),
        (
            "Quản trị",
            "Staff: `/staff/tin-cho-duyet`, `/staff/cong-ty-xac-minh`. Admin: `/admin/tai-khoan`, "
            "`/admin/bang-gia`, `/admin/chi-phi`.",
        ),
    ]
    for title, body in impl_blocks:
        add_heading(doc, f"4.4.x. {title}", 3)
        add_para(doc, body)
        add_para(doc, "[Chèn ảnh màn hình theo SCREENSHOT_CHECKLIST.md]", indent=False)

    add_heading(doc, "4.5. Kiểm thử hệ thống", 2)
    add_para(
        doc,
        "Kế hoạch kiểm thử tập trung luồng nghiệp vụ end-to-end. Cột «Thực tế» chỉ ghi nhận khi nhóm đã chạy "
        "trên môi trường cụ thể; các mục chưa chạy đánh dấu «Chưa kiểm thử» theo yêu cầu học thuật trung thực.",
    )
    add_table(
        doc,
        ["ID", "Mục tiêu", "Tiền điều kiện", "Bước chính", "Kết quả mong đợi", "Thực tế", "Trạng thái"],
        [
            ["TC01", "Đăng ký STUDENT", "Email mới", "POST register → verify email", "User PENDING/ACTIVE", "[CẦN XÁC NHẬN]", "Chưa kiểm thử"],
            ["TC02", "Đăng nhập + refresh", "Tài khoản ACTIVE", "Login → gọi API có cookie", "Access token hợp lệ", "Đã sửa SameSite production", "Cần xác nhận"],
            ["TC03", "Tìm việc public", "Không login", "GET jobs list + keyword", "200, phân trang", "[CẦN XÁC NHẬN]", "Chưa kiểm thử"],
            ["TC04", "Upload CV PDF", "SV login", "POST cvs/me/upload", "CvVersion UPLOAD", "TopCV PDF quét magic bytes", "Đạt (dev)"],
            ["TC05", "Xem CV upload", "SV login", "GET media preview", "PDF hiển thị iframe", "Đã sửa signed URL", "Cần xác nhận"],
            ["TC06", "Ứng tuyển", "Tin APPROVED", "POST applications", "201 SUBMITTED", "[CẦN XÁC NHẬN]", "Chưa kiểm thử"],
            ["TC07", "Ứng tuyển trùng", "Đã nộp", "POST lại", "400 unique", "[CẦN XÁC NHẬN]", "Chưa kiểm thử"],
            ["TC08", "Xóa CV đã ứng tuyển", "Có application", "DELETE cv", "Soft delete; apply mới fail", "Logic service", "Cần xác nhận"],
            ["TC09", "NTD tạo tin", "COMPANY verified", "POST job DRAFT", "jobId", "[CẦN XÁC NHẬN]", "Chưa kiểm thử"],
            ["TC10", "Staff duyệt tin", "STAFF login", "PATCH approve", "APPROVED + history", "[CẦN XÁC NHẬN]", "Chưa kiểm thử"],
            ["TC11", "Nạp ví VNPAY", "Sandbox/prod", "Create payment → return", "Wallet + DEPOSIT", "[CẦN XÁC NHẬN]", "Chưa kiểm thử"],
            ["TC12", "Phân tích AI CV", "Gemini key", "POST ai analyze", "analysis COMPLETED", "[CẦN XÁC NHẬN]", "Chưa kiểm thử"],
            ["TC13", "Chat 2 user", "2 tài khoản", "Socket connect /chat", "Nhận message:new", "[CẦN XÁC NHẬN]", "Chưa kiểm thử"],
            ["TC14", "RBAC admin", "STUDENT token", "GET /admin/*", "403 Forbidden", "[CẦN XÁC NHẬN]", "Chưa kiểm thử"],
        ],
    )

    add_heading(doc, "4.6. Triển khai", 2)
    add_para(
        doc,
        "Frontend: Vercel (`apps/web`, install monorepo root). Backend: Render, build `npm run build -w api`, "
        "env WEB_URL, CORS_ALLOW_VERCEL, DATABASE_URL, JWT_*, CLOUDINARY_*, VNPAY_*, GEMINI_*. "
        "Không ghi giá trị bí mật trong báo cáo.",
    )

    add_heading(doc, "4.7. Đánh giá kết quả", 2)
    add_para(
        doc,
        "Đạt: nền tảng tuyển dụng full-time, CV đa dạng, thanh toán, chat, AI — vượt đề cương freelance cơ bản. "
        "Chưa đầy đủ so với đề cương: workflow hoàn thành công việc part-time, đánh giá hai chiều sau hoàn thành gig "
        "(Review có trong schema nhưng luồng nghiệp vụ khác marketplace).",
    )

    add_heading(doc, "4.8. Khó khăn", 2)
    add_para(
        doc,
        "Cross-origin cookie refresh Vercel–Render; Cloudinary authenticated URL cho PDF; "
        "Socket.IO monorepo dependency; build Render thiếu RAM (SWC).",
    )

    add_heading(doc, "4.9. Phân công nhóm", 2)
    add_table(
        doc,
        ["Thành viên", "MSSV", "Công việc", "Xác nhận"],
        [
            ["Nguyễn Phạm Quang Thiện", "2374802011250", "[CẦN XÁC NHẬN]", ""],
            ["Nguyễn Ái Băng Nhi", "2374802010368", "[CẦN XÁC NHẬN]", ""],
            ["Nguyễn Hoàng Cẩm Trúc", "2374802010526", "[CẦN XÁC NHẬN]", ""],
        ],
    )
    doc.add_page_break()


def chapter_5(doc: Document) -> None:
    add_heading(doc, "CHƯƠNG 5: KẾT LUẬN VÀ ĐỀ XUẤT", 1)

    add_heading(doc, "5.1. Tóm tắt kết quả nghiên cứu", 2)
    add_para(
        doc,
        "Báo cáo đã phân tích thực trạng tuyển dụng trực tuyến, đặc tả yêu cầu theo ba nhóm tác nhân chính "
        "(ứng viên, NTD, quản trị), thiết kế CSDL MySQL 31 thực thể qua Prisma, và mô tả triển khai full-stack "
        "TalentHub với Next.js, NestJS, Cloudinary, VNPAY, Socket.IO và Gemini — bám sát mã nguồn monorepo.",
    )

    add_heading(doc, "5.2. Những gì đã đạt được", 2)
    achievements = [
        "Luồng tuyển dụng: tìm việc, ứng tuyển gắn snapshot CV, NTD duyệt hồ sơ.",
        "CV kép: builder JSON và upload file (PDF/DOC/DOCX) với kiểm tra magic bytes và lưu trữ private.",
        "Kiểm duyệt tin và xác minh công ty (STAFF).",
        "Monetization: ví công ty, đơn hàng, tích hợp VNPAY, gói quảng bá JobPromotion.",
        "Chat realtime và thông báo in-app.",
        "Phân tích CV bằng AI (CvAiAnalysis).",
        "Triển khai production Vercel + Render + MySQL.",
    ]
    for a in achievements:
        add_para(doc, f"• {a}", indent=False)

    add_heading(doc, "5.3. Hạn chế", 2)
    add_para(
        doc,
        "EmploymentType chưa hỗ trợ part-time theo đề cương gốc; một số hạng mục IMPLEMENTATION_PLAN vẫn «planned»; "
        "kiểm thử tự động E2E chưa phủ rộng; phụ thuộc dịch vụ bên thứ ba (Render cold start, quota Gemini). "
        "Ảnh minh họa giao diện trong Word cần nhóm chụp bổ sung theo checklist.",
    )

    add_heading(doc, "5.4. Kiến nghị", 2)
    add_para(
        doc,
        "Thống nhất tên đề tài với GVHD (tuyển dụng trực tuyến thay vì marketplace freelance nếu không bổ sung gig workflow). "
        "Hoàn thiện bảng kiểm thử trên production và đính kèm link demo ổn định. Bổ sung tài liệu vận hành cho STAFF.",
    )

    add_heading(doc, "5.5. Hướng phát triển tương lai", 2)
    add_para(
        doc,
        "Các hướng sau là đề xuất, chưa triển khai: gợi ý việc làm (collaborative filtering); tìm kiếm Elasticsearch; "
        "AI matching JD–CV sâu hơn; analytics dashboard; 2FA; mobile app React Native; mở rộng EmploymentType PART_TIME "
        "nếu muốn lại gần đề cương freelance.",
    )
    doc.add_page_break()

    add_heading(doc, "TÀI LIỆU THAM KHẢO", 1)
    refs = [
        "NestJS Documentation. https://docs.nestjs.com/",
        "Next.js Documentation. https://nextjs.org/docs",
        "Prisma Documentation. https://www.prisma.io/docs",
        "JWT RFC 7519. https://datatracker.ietf.org/doc/html/rfc7519",
        "VNPAY Tài liệu tích hợp (portal merchant — không trích dẫn secret).",
        "Google AI Gemini API Documentation. https://ai.google.dev/",
        "Cloudinary Documentation. https://cloudinary.com/documentation",
    ]
    for i, r in enumerate(refs, 1):
        add_para(doc, f"[{i}] {r}", indent=False)

    doc.add_page_break()
    add_heading(doc, "PHỤ LỤC", 1)

    add_heading(doc, "Phụ lục A. Hướng dẫn cài đặt (tóm tắt)", 2)
    add_para(
        doc,
        "Yêu cầu: Node.js LTS, MySQL 8, tài khoản Cloudinary/Gemini/VNPAY (dev). Clone monorepo; "
        "cp apps/api/.env.example → .env và cấu hình DATABASE_URL, JWT, CLOUDINARY, VNPAY, GEMINI; "
        "npm install tại root; npx prisma migrate dev -w api; npm run dev (web + api). Chi tiết: docs/SETUP.md.",
        indent=False,
    )

    add_heading(doc, "Phụ lục B. Hướng dẫn sử dụng theo vai trò", 2)
    add_para(
        doc,
        "Ứng viên: đăng ký → tạo/upload CV tại /sinh-vien/cv → tìm việc /viec-lam → ứng tuyển → theo dõi /sinh-vien/ung-tuyen. "
        "NTD: hoàn thiện /cong-ty/ho-so → tạo tin → thanh toán/đăng tin → quản lý ứng viên trên tin. "
        "STAFF: /staff/tin-cho-duyet, /staff/cong-ty-xac-minh. Admin: /admin/tong-quan, bảng giá, tài khoản.",
        indent=False,
    )

    add_heading(doc, "Phụ lục C. Mã nguồn và tài liệu kỹ thuật", 2)
    add_para(doc, "Repository: [CẦN SINH VIÊN XÁC NHẬN URL GitHub công khai]", indent=False)
    add_para(doc, "Swagger production: https://[API_HOST]/api/docs (không đưa secret vào báo cáo).", indent=False)
    add_para(doc, "Sơ đồ nguồn: TALENTHUB_REPORT/diagrams/*.drawio", indent=False)

    add_heading(doc, "Phụ lục D. Bổ sung test case", 2)
    add_para(doc, "Xem Bảng 4.3; có thể nhân bản mẫu TC01–TC14 cho regression trước bảo vệ.", indent=False)

    from report_extended_content import section_appendix_srs

    section_appendix_srs(doc, add_heading, add_para, add_table)


def build_document() -> Document:
    DIAGRAM_EXPORTS.mkdir(parents=True, exist_ok=True)
    doc = Document()
    setup_page(doc)
    style_normal(doc)
    cover_pages(doc)
    preliminary(doc)
    chapter_1(doc)
    chapter_2(doc)
    chapter_3(doc)
    chapter_4(doc)
    chapter_5(doc)
    return doc


def main() -> None:
    import shutil
    import sys

    sys.path.insert(0, str(Path(__file__).resolve().parent))
    DIAGRAM_EXPORTS.mkdir(parents=True, exist_ok=True)
    doc = build_document()
    doc.save(str(OUT_DOCX))
    shutil.copy2(OUT_DOCX, OUT_DOCX_MID)
    print(f"Đã tạo: {OUT_DOCX}")
    print(f"Bản sao báo cáo tiến độ: {OUT_DOCX_MID}")


if __name__ == "__main__":
    main()
