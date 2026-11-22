# -*- coding: utf-8 -*-
"""Sinh file PowerPoint báo cáo tiến độ giữa kỳ — TalentHub."""
from __future__ import annotations

from pathlib import Path

from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.util import Inches, Pt

OUT = Path(__file__).resolve().parents[1] / "TalentHub_Bao_Cao_Tien_Do_Giua_Ky.pptx"

TITLE = "XÂY DỰNG NỀN TẢNG TUYỂN DỤNG TRỰC TUYẾN TALENTHUB"
STUDENTS = [
    "Nguyễn Phạm Quang Thiện — 2374802011250",
    "Nguyễn Ái Băng Nhi — 2374802010368",
    "Nguyễn Hoàng Cẩm Trúc — 2374802010526",
]
ADVISOR = "ThS. Nguyễn Văn Trung"
ACCENT = RGBColor(0x1A, 0x56, 0xDB)
DARK = RGBColor(0x1E, 0x29, 0x3B)


def set_slide_title(slide, text: str) -> None:
    if slide.shapes.title:
        slide.shapes.title.text = text
        for p in slide.shapes.title.text_frame.paragraphs:
            p.font.size = Pt(28)
            p.font.bold = True
            p.font.color.rgb = DARK


def add_bullets(slide, items: list[str], left=0.6, top=1.5, width=8.8, height=5.0, size=18) -> None:
    box = slide.shapes.add_textbox(Inches(left), Inches(top), Inches(width), Inches(height))
    tf = box.text_frame
    tf.word_wrap = True
    tf.vertical_anchor = MSO_ANCHOR.TOP
    for i, line in enumerate(items):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.text = line
        p.level = 0
        p.font.size = Pt(size)
        p.font.color.rgb = DARK
        p.space_after = Pt(8)


def title_slide(prs: Presentation) -> None:
    slide = prs.slides.add_slide(prs.slide_layouts[0])
    slide.shapes.title.text = TITLE
    sub = slide.placeholders[1]
    sub.text = (
        "Báo cáo tiến độ giữa kỳ\n"
        "Chuyên đề tốt nghiệp 2 — Công nghệ phần mềm\n"
        "Trường Đại học Văn Lang — Khoa CNTT\n\n"
        + "\n".join(STUDENTS)
        + f"\n\nGiảng viên hướng dẫn: {ADVISOR}\n"
        "TP. Hồ Chí Minh, 2026"
    )
    for p in slide.shapes.title.text_frame.paragraphs:
        p.font.size = Pt(26)
        p.font.color.rgb = ACCENT
    for p in sub.text_frame.paragraphs:
        p.font.size = Pt(16)
        p.alignment = PP_ALIGN.CENTER


def content_slide(prs: Presentation, title: str, bullets: list[str]) -> None:
    slide = prs.slides.add_slide(prs.slide_layouts[1])
    set_slide_title(slide, title)
    add_bullets(slide, bullets)


def main() -> None:
    prs = Presentation()
    prs.slide_width = Inches(10)
    prs.slide_height = Inches(7.5)

    title_slide(prs)

    content_slide(
        prs,
        "1. Giới thiệu & mục tiêu",
        [
            "TalentHub: nền tảng web kết nối ứng viên (sinh viên) với nhà tuyển dụng.",
            "Mục tiêu: phân tích — thiết kế — xây dựng hệ thống tuyển dụng trực tuyến end-to-end.",
            "Phạm vi: đăng tin, ứng tuyển, CV, ví/VNPAY, chat, thông báo, kiểm duyệt, quản trị.",
            "Sản phẩm triển khai được trên cloud (Vercel + Render + MySQL).",
        ],
    )

    content_slide(
        prs,
        "2. Điều chỉnh so với đề cương ban đầu",
        [
            "Đề cương gợi ý: marketplace freelance/part-time, Spring Boot + React.",
            "Thực tế nhóm triển khai: tuyển dụng full-time, monorepo NestJS + Next.js.",
            "Bổ sung: Cloudinary (CV/logo), VNPAY (nạp ví), Socket.IO (chat), Gemini (AI CV).",
            "Đã thống nhất hướng với GVHD: báo cáo trung thực phạm vi sản phẩm thực tế.",
        ],
    )

    content_slide(
        prs,
        "3. Kiến trúc hệ thống",
        [
            "Client–server: Next.js 15 (frontend) ↔ NestJS 11 REST API `/api/v1`.",
            "Xác thực: JWT access + refresh token (HttpOnly cookie, RBAC 4 vai trò).",
            "CSDL: MySQL, Prisma ORM (~30+ bảng nghiệp vụ).",
            "Realtime: Socket.IO namespace `/chat`.",
            "Triển khai: Frontend Vercel · API Render · DB MySQL (Aiven/cloud).",
        ],
    )

    content_slide(
        prs,
        "4. Công nghệ sử dụng",
        [
            "Backend: TypeScript, NestJS, Swagger, Argon2, class-validator.",
            "Frontend: React 19, App Router, Tailwind CSS, TanStack Query, Axios.",
            "Tích hợp: Cloudinary, VNPAY, Google Gemini API.",
            "Công cụ: Git, npm workspaces, Prisma Migrate, tài liệu docs/SETUP.md.",
        ],
    )

    content_slide(
        prs,
        "5. Tiến độ theo giai đoạn (IMPLEMENTATION_PLAN)",
        [
            "✓ Phase 1–2: Monorepo, schema DB, migration, seed.",
            "✓ Phase 3–4: Auth, profiles, jobs, staff duyệt tin.",
            "✓ Phase 5–6: CV builder/upload, ứng tuyển, AI phân tích CV.",
            "✓ Phase 7–8: VNPAY, ví công ty, chat, thông báo, media.",
            "✓ Phase 9–10: Moderation, admin dashboard, bảo mật, tài liệu API.",
            "○ Còn hoàn thiện: một số UI moderation, kiểm thử E2E mở rộng.",
        ],
    )

    content_slide(
        prs,
        "6. Chức năng — Ứng viên (STUDENT)",
        [
            "Đăng ký / đăng nhập / xác thực email / đổi mật khẩu.",
            "Hồ sơ cá nhân; CV builder và upload PDF/DOC/DOCX.",
            "Tìm việc, lưu tin, nộp hồ sơ (snapshot CvVersion).",
            "Theo dõi trạng thái ứng tuyển; chat với NTD; thông báo.",
            "Phân tích CV bằng AI (Gemini).",
        ],
    )

    content_slide(
        prs,
        "7. Chức năng — NTD & Quản trị",
        [
            "NTD: hồ sơ công ty, tạo/đăng tin, gói quảng bá, ví + VNPAY.",
            "NTD: xem ứng viên, CV đã nộp, cập nhật trạng thái hồ sơ, AI job-match.",
            "STAFF: duyệt tin, xác minh công ty, xử lý báo cáo, nhật ký moderation.",
            "SUPER_ADMIN: tài khoản, bảng giá, danh mục, chi phí, thống kê.",
        ],
    )

    content_slide(
        prs,
        "8. Demo & triển khai",
        [
            "Web production: Vercel (ví dụ talenthub-gray.vercel.app).",
            "API production: Render; Swagger tại `/api/docs` trên host API.",
            "Luồng demo giữa kỳ: đăng nhập → tìm việc → ứng tuyển → NTD duyệt hồ sơ.",
            "Tài liệu: báo cáo Word, sơ đồ Draw.io (ERD, use case, sequence).",
        ],
    )

    content_slide(
        prs,
        "9. Khó khăn & giải pháp",
        [
            "Cross-origin cookie (Vercel ↔ Render): SameSite=None; Secure cho refresh.",
            "CV PDF trên Cloudinary: preview authenticated, API preview riêng.",
            "Upload PDF một số nguồn: kiểm tra magic bytes linh hoạt.",
            "Cold start Render / cấu hình env production: tài liệu DEPLOY_*.md.",
        ],
    )

    content_slide(
        prs,
        "10. Kế hoạch cuối kỳ",
        [
            "Hoàn thiện kiểm thử chức năng + ảnh minh họa báo cáo.",
            "Chốt báo cáo Word, ERD, test case; bổ sung phân công nhóm.",
            "Tối ưu UX (tìm kiếm, moderation UI) nếu còn thời gian.",
            "Chuẩn bị slide bảo vệ + demo live ổn định.",
        ],
    )

    slide = prs.slides.add_slide(prs.slide_layouts[1])
    set_slide_title(slide, "Cảm ơn thầy/cô và các bạn!")
    add_bullets(
        slide,
        [
            "Nhóm sẵn sàng demo hệ thống và nhận góp ý của ThS. Nguyễn Văn Trung.",
            "Q & A",
        ],
        top=2.2,
        size=22,
    )

    prs.save(str(OUT))
    print(f"Đã tạo: {OUT}")


if __name__ == "__main__":
    main()
