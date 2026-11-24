# -*- coding: utf-8 -*-
"""Cập nhật hoàn chỉnh file Poster PowerPoint theo dự án TalentHub."""

from pptx import Presentation
from pptx.util import Cm, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN

TEMPLATE_PATH = r"D:\TalentHub\Poster_mau_CDTN2_60x90.pptx"
OUTPUT_PATH = r"D:\TalentHub\Poster_TalentHub_60x90.pptx"

prs = Presentation(TEMPLATE_PATH)
slide = prs.slides[0]

# --- 1. CHUYÊN NGÀNH (Shape 3) ---
chuyen_nganh_shape = slide.shapes[3]
tf3 = chuyen_nganh_shape.text_frame
tf3.text = "CHUYÊN NGÀNH: CÔNG NGHỆ PHẦN MỀM"
p3 = tf3.paragraphs[0]
p3.alignment = PP_ALIGN.CENTER
if p3.runs:
    p3.runs[0].font.bold = True
    p3.runs[0].font.size = Pt(22)
    p3.runs[0].font.color.rgb = RGBColor(199, 31, 39)

# --- 2. TÊN ĐỀ TÀI (Shape 4) ---
ten_de_tai_shape = slide.shapes[4]
tf4 = ten_de_tai_shape.text_frame
tf4.text = "TALENTHUB – NỀN TẢNG TUYỂN DỤNG\nTRỰC TUYẾN CHO SINH VIÊN"
for p in tf4.paragraphs:
    p.alignment = PP_ALIGN.CENTER
    if p.runs:
        p.runs[0].font.bold = True
        p.runs[0].font.size = Pt(60)
        p.runs[0].font.color.rgb = RGBColor(255, 255, 255)

# --- 3. NHÓM THỰC HIỆN (Shape 5) ---
nhom_shape = slide.shapes[5]
tf5 = nhom_shape.text_frame
tf5.clear()

p5_1 = tf5.paragraphs[0]
p5_1.alignment = PP_ALIGN.CENTER
r5_1 = p5_1.add_run()
r5_1.text = "Sinh viên thực hiện: "
r5_1.font.bold = True
r5_1.font.size = Pt(23)
r5_1.font.color.rgb = RGBColor(255, 255, 255)

r5_2 = p5_1.add_run()
r5_2.text = "Nguyễn Phạm Quang Thiện (2374802011250) · Nguyễn Ái Băng Nhi (2374802010368) · Nguyễn Hoàng Cẩm Trúc (2374802010526)"
r5_2.font.bold = False
r5_2.font.size = Pt(23)
r5_2.font.color.rgb = RGBColor(255, 255, 255)

p5_2 = tf5.add_paragraph()
p5_2.alignment = PP_ALIGN.CENTER
r5_3 = p5_2.add_run()
r5_3.text = "Giảng viên hướng dẫn: "
r5_3.font.bold = True
r5_3.font.size = Pt(23)
r5_3.font.color.rgb = RGBColor(255, 255, 255)

r5_4 = p5_2.add_run()
r5_4.text = "ThS. Nguyễn Văn Trung"
r5_4.font.bold = False
r5_4.font.size = Pt(23)
r5_4.font.color.rgb = RGBColor(255, 255, 255)

# --- 4. HÌNH SẢN PHẨM CHÍNH (Shape 8) ---
sh8 = slide.shapes[8]
left8, top8, w8, h8 = sh8.left, sh8.top, sh8.width, sh8.height
# Clear text and make transparent/background
sh8.text_frame.clear()
sh8.fill.background()
# Add picture exactly over shape 8
slide.shapes.add_picture(r"D:\TalentHub\main_hero_mockup.png", left8, top8, w8, h8)

# --- 5. QR CODE & LINK (Shape 11 & QR Card) ---
sh11 = slide.shapes[11]
left11, top11, w11, h11 = sh11.left, sh11.top, sh11.width, sh11.height
sh11.text_frame.clear()
sh11.fill.background()
# Insert QR code slightly centered
qr_size = Cm(7.2)
qr_left = left11 + (w11 - qr_size) // 2
qr_top = top11 + Cm(0.2)
slide.shapes.add_picture(r"D:\TalentHub\qr_demo.png", qr_left, qr_top, qr_size, qr_size)

# Add URL text under QR inside Shape 9
url_box = slide.shapes.add_textbox(left11 - Cm(1.0), qr_top + qr_size + Cm(0.15), w11 + Cm(2.0), Cm(1.2))
tf_url = url_box.text_frame
tf_url.word_wrap = True
p_url = tf_url.paragraphs[0]
p_url.alignment = PP_ALIGN.CENTER
r_url = p_url.add_run()
r_url.text = "talenthub-gray.vercel.app"
r_url.font.size = Pt(20)
r_url.font.bold = True
r_url.font.color.rgb = RGBColor(255, 255, 255)

# --- 6. HÌNH SẢN PHẨM PHỤ (Shape 12) ---
sh12 = slide.shapes[12]
left12, top12, w12, h12 = sh12.left, sh12.top, sh12.width, sh12.height
sh12.text_frame.clear()
sh12.fill.background()
slide.shapes.add_picture(r"D:\TalentHub\secondary_features_mockup.png", left12, top12, w12, h12)

# --- 7. BỐN CHỈ SỐ KẾT QUẢ QUAN TRỌNG (Shapes 14, 15, 17, 18, 20, 21, 23, 24) ---
# Metric 1
slide.shapes[14].text_frame.paragraphs[0].text = "121"
slide.shapes[14].text_frame.paragraphs[0].runs[0].font.size = Pt(64)
slide.shapes[14].text_frame.paragraphs[0].runs[0].font.bold = True
slide.shapes[15].text_frame.paragraphs[0].text = "Test case · 10 phân hệ nghiệp vụ"

# Metric 2
slide.shapes[17].text_frame.paragraphs[0].text = "128"
slide.shapes[17].text_frame.paragraphs[0].runs[0].font.size = Pt(64)
slide.shapes[17].text_frame.paragraphs[0].runs[0].font.bold = True
slide.shapes[18].text_frame.paragraphs[0].text = "REST API · 23 controller · 4 vai trò"

# Metric 3
slide.shapes[20].text_frame.paragraphs[0].text = "38"
slide.shapes[20].text_frame.paragraphs[0].runs[0].font.size = Pt(64)
slide.shapes[20].text_frame.paragraphs[0].runs[0].font.bold = True
slide.shapes[21].text_frame.paragraphs[0].text = "Bảng CSDL Prisma · 31 Enum"

# Metric 4
slide.shapes[23].text_frame.paragraphs[0].text = "4/4"
slide.shapes[23].text_frame.paragraphs[0].runs[0].font.size = Pt(64)
slide.shapes[23].text_frame.paragraphs[0].runs[0].font.bold = True
slide.shapes[24].text_frame.paragraphs[0].text = "Tích hợp: VNPAY, Gemini, Socket, Cloud"

# Add footnote below metric cards
fn_box = slide.shapes.add_textbox(Cm(2.5), Cm(51.3), Cm(55.0), Cm(1.5))
tf_fn = fn_box.text_frame
p_fn = tf_fn.paragraphs[0]
p_fn.alignment = PP_ALIGN.RIGHT
r_fn = p_fn.add_run()
r_fn.text = "* Số liệu thực tế từ mã nguồn monorepo (11/2026), CSDL Prisma và bộ tài liệu kiểm thử TalentHub"
r_fn.font.size = Pt(16)
r_fn.font.italic = True
r_fn.font.color.rgb = RGBColor(120, 120, 120)

# --- 8. MỤC 2: VẤN ĐỀ & MỤC TIÊU (Shape 27) ---
sh27 = slide.shapes[27]
tf27 = sh27.text_frame
tf27.clear()

bullets2 = [
    ("Sinh viên tìm việc thường gặp tin rác, khó kiểm chứng, thiếu công cụ tối ưu CV; doanh nghiệp tốn nhiều thời gian và chi phí sàng lọc hồ sơ.", False),
    ("• Khép kín luồng: Đăng tin → Duyệt tin → Ứng tuyển → Phỏng vấn → Tuyển dụng", True),
    ("• Hỗ trợ CV kép (trực tuyến & tải tệp) + phân tích độ phù hợp bằng Google Gemini AI", True),
    ("• Minh bạch tuyển dụng: Kiểm duyệt tin (STAFF), nạp ví & thanh toán VNPAY an toàn", True)
]

for idx, (b_text, is_bullet) in enumerate(bullets2):
    p = tf27.paragraphs[0] if idx == 0 else tf27.add_paragraph()
    r = p.add_run()
    r.text = b_text
    r.font.size = Pt(21)
    if is_bullet:
        r.font.bold = False
        p.space_after = Pt(6)
    else:
        r.font.bold = False
        p.space_after = Pt(10)

# --- 9. MỤC 3: GIẢI PHÁP & CÔNG NGHỆ (Shape 30 & Shape 31-36) ---
sh30 = slide.shapes[30]
left30, top30, w30, h30 = sh30.left, sh30.top, sh30.width, sh30.height
sh30.text_frame.clear()
sh30.fill.background()
slide.shapes.add_picture(r"D:\TalentHub\architecture_diagram_mockup.png", left30, top30, w30, h30)

# 6 Tech pills
techs = [
    (31, "TypeScript (Node 22)"),
    (32, "Next.js 15 - NestJS 11"),
    (33, "MySQL - Prisma ORM"),
    (34, "Gemini AI - Socket.IO"),
    (35, "VNPAY - Cloudinary"),
    (36, "Vercel - Render")
]
for shape_id, tech_name in techs:
    sh = slide.shapes[shape_id]
    tf = sh.text_frame
    tf.text = tech_name
    p = tf.paragraphs[0]
    p.alignment = PP_ALIGN.CENTER
    if p.runs:
        p.runs[0].font.bold = True
        p.runs[0].font.size = Pt(20)
        p.runs[0].font.color.rgb = RGBColor(199, 31, 39)

# --- 10. MỤC 4: KIỂM THỬ & ĐÁNH GIÁ (Shape 39) ---
sh39 = slide.shapes[39]
left39, top39, w39, h39 = sh39.left, sh39.top, sh39.width, sh39.height
sh39.text_frame.clear()
sh39.fill.background()
slide.shapes.add_picture(r"D:\TalentHub\testing_chart_mockup.png", left39, top39, w39, h39)

# --- 11. MỤC 5: KẾT LUẬN & HƯỚNG PHÁT TRIỂN (Shape 42 & 43) ---
sh42 = slide.shapes[42]
tf42 = sh42.text_frame
tf42.clear()

bullets5 = [
    "• Hoàn thành xây dựng nền tảng TalentHub với quy trình tuyển dụng trọn vẹn, CV builder, thanh toán VNPAY, chat realtime và trợ lý AI.",
    "• Hạn chế: Chưa triển khai kiểm thử tự động toàn diện trên pipeline CI/CD; chưa hỗ trợ đánh giá hai chiều sau khi hoàn tất công việc.",
    "• Phát triển: Thuật toán AI matching JD–CV sâu hơn, tìm kiếm nâng cao bằng Elasticsearch, xây dựng ứng dụng di động (Flutter/React Native)."
]
for idx, b_text in enumerate(bullets5):
    p = tf42.paragraphs[0] if idx == 0 else tf42.add_paragraph()
    r = p.add_run()
    r.text = b_text
    r.font.size = Pt(20)
    p.space_after = Pt(8)

# Shape 43: Tài liệu tham khảo
sh43 = slide.shapes[43]
tf43 = sh43.text_frame
tf43.clear()

p_ref_title = tf43.paragraphs[0]
r_ref_title = p_ref_title.add_run()
r_ref_title.text = "Tài liệu tham khảo"
r_ref_title.font.bold = True
r_ref_title.font.size = Pt(20)
p_ref_title.space_after = Pt(4)

refs = [
    "[1] NestJS & Next.js Documentation, official technical guides, 2026.",
    "[2] Google Gemini API & Prisma ORM Official Guides, 2026."
]
for r_text in refs:
    p = tf43.add_paragraph()
    r = p.add_run()
    r.text = r_text
    r.font.size = Pt(16)
    p.space_after = Pt(2)

prs.save(OUTPUT_PATH)
print(f"Poster successfully updated and saved to: {OUTPUT_PATH}")
