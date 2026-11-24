# -*- coding: utf-8 -*-
"""Tạo các hình ảnh trực quan chất lượng cao cho Poster Chuyên đề tốt nghiệp 2 — TalentHub."""

import os
from PIL import Image, ImageDraw, ImageFont

FONTS_DIR = r"C:\Windows\Fonts"
FONT_REGULAR = os.path.join(FONTS_DIR, "segoeui.ttf")
FONT_BOLD = os.path.join(FONTS_DIR, "segoeuib.ttf")
FONT_SEMIBOLD = os.path.join(FONTS_DIR, "segoeuisl.ttf")
if not os.path.exists(FONT_SEMIBOLD):
    FONT_SEMIBOLD = FONT_REGULAR

# Colors matching Van Lang red & modern SaaS
RED_PRIMARY = (211, 47, 47)      # #D32F2F
RED_DARK = (183, 28, 28)         # #B71C1C
RED_LIGHT = (254, 226, 226)      # #FEE2E2
RED_ACCENT = (225, 29, 72)       # #E11D48
BG_LIGHT = (248, 250, 252)       # #F8FAFC
CARD_BG = (255, 255, 255)
TEXT_DARK = (15, 23, 42)         # #0F172A
TEXT_MUTED = (100, 116, 139)     # #64748B
BORDER_COLOR = (226, 232, 240)   # #E2E8F0
BLUE_ACCENT = (37, 99, 235)      # #2563EB
GREEN_ACCENT = (22, 163, 74)     # #16A34A

def get_font(size, bold=False):
    fpath = FONT_BOLD if bold else FONT_REGULAR
    return ImageFont.truetype(fpath, size)

# -------------------------------------------------------------------------
# 1. MAIN PRODUCT HERO MOCKUP (2136 x 1128 px)
# -------------------------------------------------------------------------
def create_main_hero():
    w, h = 2136, 1128
    img = Image.new("RGB", (w, h), (255, 255, 255))
    draw = ImageDraw.Draw(img)

    # Browser Outer Window Frame
    draw.rounded_rectangle([0, 0, w - 1, h - 1], radius=24, fill=(241, 245, 249), outline=(203, 213, 225), width=2)
    
    # Browser Header bar
    draw.rounded_rectangle([0, 0, w - 1, 64], radius=24, fill=(248, 250, 252))
    draw.rectangle([0, 40, w - 1, 64], fill=(248, 250, 252)) # fill bottom curve of header
    draw.line([(0, 64), (w - 1, 64)], fill=(226, 232, 240), width=2)
    
    # Window control dots
    draw.ellipse([28, 24, 44, 40], fill=(239, 68, 68))    # Close
    draw.ellipse([54, 24, 70, 40], fill=(245, 158, 11))   # Min
    draw.ellipse([80, 24, 96, 40], fill=(34, 197, 94))    # Max
    
    # URL bar
    draw.rounded_rectangle([w // 4, 14, 3 * w // 4, 50], radius=18, fill=(255, 255, 255), outline=(226, 232, 240), width=1)
    font_url = get_font(20)
    draw.text((w // 4 + 24, 20), "🔒 https://talenthub-gray.vercel.app", fill=(100, 116, 139), font=font_url)

    # App Web Content Canvas
    content_box = [0, 64, w - 1, h - 1]
    draw.rectangle(content_box, fill=(255, 255, 255))

    # App Navbar
    nav_h = 80
    draw.line([(0, 64 + nav_h), (w - 1, 64 + nav_h)], fill=(241, 245, 249), width=2)
    
    # Logo TalentHub
    draw.rounded_rectangle([48, 80, 96, 128], radius=12, fill=BLUE_ACCENT)
    draw.text((60, 84), "T", fill=(255, 255, 255), font=get_font(34, bold=True))
    draw.text((110, 84), "TalentHub", fill=TEXT_DARK, font=get_font(36, bold=True))
    draw.text((275, 96), "• VIỆC LÀM SINH VIÊN", fill=RED_PRIMARY, font=get_font(18, bold=True))

    # Nav links
    nav_links = ["Tìm việc làm", "Nhà tuyển dụng", "Tạo CV trực tuyến", "Cẩm nang nghề nghiệp"]
    lx = 540
    for nl in nav_links:
        draw.text((lx, 94), nl, fill=TEXT_DARK if nl == "Tìm việc làm" else TEXT_MUTED, font=get_font(22, bold=(nl == "Tìm việc làm")))
        lx += 230

    # Nav right buttons
    draw.rounded_rectangle([w - 360, 82, w - 210, 130], radius=10, outline=BORDER_COLOR, fill=(255, 255, 255), width=2)
    draw.text((w - 330, 94), "Đăng nhập", fill=TEXT_DARK, font=get_font(20, bold=True))
    
    draw.rounded_rectangle([w - 190, 82, w - 48, 130], radius=10, fill=RED_PRIMARY)
    draw.text((w - 170, 94), "Đăng tin tuyển", fill=(255, 255, 255), font=get_font(20, bold=True))

    # Hero Banner Background (Soft gradient feel)
    draw.rectangle([0, 144, w - 1, h - 1], fill=(248, 250, 252))
    
    # Left Hero Text Column
    left_x = 72
    
    # Badge Pill
    draw.rounded_rectangle([left_x, 180, left_x + 580, 226], radius=23, fill=RED_LIGHT, outline=(254, 202, 202), width=1)
    draw.text((left_x + 20, 190), "✦  Nền tảng tuyển dụng trực tuyến cho sinh viên & doanh nghiệp", fill=RED_DARK, font=get_font(19, bold=True))

    # Main Headline
    draw.text((left_x, 245), "Việc làm phù hợp,", fill=TEXT_DARK, font=get_font(68, bold=True))
    draw.text((left_x, 325), "kết nối đúng người.", fill=RED_PRIMARY, font=get_font(68, bold=True))

    # Subtitle
    subtext = "Tìm kiếm cơ hội việc làm thực tập & full-time, xây dựng CV trực tuyến chuẩn ATS,\nphân tích độ khớp CV bằng Google Gemini AI và kết nối trực tiếp với nhà tuyển dụng."
    draw.text((left_x, 420), subtext, fill=TEXT_MUTED, font=get_font(26))

    # Big Search Bar Box
    sb_y = 520
    sb_w = 1220
    sb_h = 100
    draw.rounded_rectangle([left_x, sb_y, left_x + sb_w, sb_y + sb_h], radius=20, fill=(255, 255, 255), outline=(203, 213, 225), width=2)
    
    # Search inputs inside box
    draw.text((left_x + 36, sb_y + 34), "🔍  Vị trí tuyển dụng, kỹ năng, công ty...", fill=(148, 163, 184), font=get_font(23))
    draw.line([(left_x + 530, sb_y + 20), (left_x + 530, sb_y + 80)], fill=BORDER_COLOR, width=2)
    
    draw.text((left_x + 560, sb_y + 34), "🏢  Tất cả ngành nghề ▾", fill=TEXT_DARK, font=get_font(22))
    draw.line([(left_x + 850, sb_y + 20), (left_x + 850, sb_y + 80)], fill=BORDER_COLOR, width=2)

    draw.text((left_x + 880, sb_y + 34), "📍  TP. Hồ Chí Minh ▾", fill=TEXT_DARK, font=get_font(22))
    
    # Search Button
    draw.rounded_rectangle([left_x + sb_w - 180, sb_y + 12, left_x + sb_w - 16, sb_y + sb_h - 12], radius=14, fill=RED_PRIMARY)
    draw.text((left_x + sb_w - 155, sb_y + 34), "Tìm việc", fill=(255, 255, 255), font=get_font(24, bold=True))

    # Popular tags below search bar
    draw.text((left_x, 650), "Từ khóa phổ biến:", fill=TEXT_MUTED, font=get_font(21, bold=True))
    tags = ["Thực tập sinh IT", "Frontend React/Next.js", "Backend NestJS", "Data Analyst", "Full-stack Developer", "Marketing"]
    tx = left_x + 200
    for t in tags:
        tw = len(t) * 12 + 30
        draw.rounded_rectangle([tx, 642, tx + tw, 682], radius=20, fill=(255, 255, 255), outline=BORDER_COLOR, width=1)
        draw.text((tx + 16, 650), t, fill=TEXT_DARK, font=get_font(19))
        tx += tw + 14

    # 3 Featured Job Cards in row
    jc_y = 720
    jobs = [
        {"role": "Lập trình viên Frontend (React/Next.js)", "company": "VNG Corporation", "sal": "12 - 18 triệu", "loc": "Quận 7, TP.HCM", "tag": "Full-time"},
        {"role": "Thực tập sinh Backend (NestJS / Node.js)", "company": "FPT Software HCM", "sal": "6 - 10 triệu", "loc": "TP. Thủ Đức", "tag": "Internship"},
        {"role": "Kỹ sư dữ liệu Junior (Python / SQL)", "company": "MoMo - Fintech", "sal": "15 - 22 triệu", "loc": "Quận 3, TP.HCM", "tag": "Full-time"}
    ]
    card_w = 385
    for i, j in enumerate(jobs):
        cx = left_x + i * (card_w + 32)
        draw.rounded_rectangle([cx, jc_y, cx + card_w, jc_y + 340], radius=18, fill=(255, 255, 255), outline=BORDER_COLOR, width=2)
        
        # Company logo badge
        draw.rounded_rectangle([cx + 24, jc_y + 24, cx + 76, jc_y + 76], radius=12, fill=(241, 245, 249))
        draw.text((cx + 38, jc_y + 32), j["company"][0], fill=BLUE_ACCENT, font=get_font(30, bold=True))
        
        draw.text((cx + 90, jc_y + 28), j["company"], fill=TEXT_MUTED, font=get_font(20, bold=True))
        draw.text((cx + 90, jc_y + 54), j["loc"], fill=(148, 163, 184), font=get_font(18))
        
        # Title
        draw.text((cx + 24, jc_y + 96), j["role"][:26] + "...", fill=TEXT_DARK, font=get_font(22, bold=True))
        
        # Tags
        draw.rounded_rectangle([cx + 24, jc_y + 140, cx + 130, jc_y + 172], radius=8, fill=RED_LIGHT)
        draw.text((cx + 34, jc_y + 144), j["tag"], fill=RED_DARK, font=get_font(17, bold=True))

        draw.rounded_rectangle([cx + 144, jc_y + 140, cx + 270, jc_y + 172], radius=8, fill=(241, 245, 249))
        draw.text((cx + 154, jc_y + 144), "Đã kiểm duyệt", fill=GREEN_ACCENT, font=get_font(17, bold=True))
        
        # Salary & apply
        draw.line([(cx + 24, jc_y + 210), (cx + card_w - 24, jc_y + 210)], fill=BORDER_COLOR, width=1)
        draw.text((cx + 24, jc_y + 240), "Mức lương:", fill=TEXT_MUTED, font=get_font(18))
        draw.text((cx + 24, jc_y + 270), j["sal"], fill=RED_PRIMARY, font=get_font(26, bold=True))
        
        draw.rounded_rectangle([cx + card_w - 120, jc_y + 250, cx + card_w - 24, jc_y + 306], radius=10, fill=BLUE_ACCENT)
        draw.text((cx + card_w - 105, jc_y + 266), "Ứng tuyển", fill=(255, 255, 255), font=get_font(19, bold=True))

    # Right Hero Floating Card: Gemini AI CV Analysis (like the phone in Unishift)
    rc_x = 1370
    rc_y = 180
    rc_w = 690
    rc_h = 880
    
    # Shadow layer
    draw.rounded_rectangle([rc_x + 10, rc_y + 10, rc_x + rc_w + 10, rc_y + rc_h + 10], radius=28, fill=(226, 232, 240))
    # Card body
    draw.rounded_rectangle([rc_x, rc_y, rc_x + rc_w, rc_y + rc_h], radius=28, fill=(255, 255, 255), outline=BORDER_COLOR, width=2)
    
    # Header card
    draw.rounded_rectangle([rc_x, rc_y, rc_x + rc_w, rc_y + 100], radius=28, fill=RED_PRIMARY)
    draw.rectangle([rc_x, rc_y + 50, rc_x + rc_w, rc_y + 100], fill=RED_PRIMARY)
    draw.text((rc_x + 36, rc_y + 22), "🤖  TRỢ LÝ AI GEMINI", fill=(255, 255, 255), font=get_font(24, bold=True))
    draw.text((rc_x + 36, rc_y + 58), "Phân tích độ khớp CV & Tin tuyển dụng", fill=(254, 202, 202), font=get_font(19))

    # Match Score Circle Widget
    draw.rounded_rectangle([rc_x + 36, rc_y + 130, rc_x + rc_w - 36, rc_y + 270], radius=20, fill=(248, 250, 252), outline=BORDER_COLOR, width=1)
    
    # Score donut ring graphic
    draw.ellipse([rc_x + 64, rc_y + 150, rc_x + 164, rc_y + 250], fill=(220, 252, 231), outline=GREEN_ACCENT, width=8)
    draw.text((rc_x + 85, rc_y + 175), "92%", fill=GREEN_ACCENT, font=get_font(38, bold=True))
    
    draw.text((rc_x + 190, rc_y + 160), "Mức độ phù hợp hồ sơ", fill=TEXT_DARK, font=get_font(26, bold=True))
    draw.text((rc_x + 190, rc_y + 200), "Vị trí: Backend NestJS Developer", fill=BLUE_ACCENT, font=get_font(21, bold=True))
    draw.text((rc_x + 190, rc_y + 230), "Ứng viên: Nguyễn Phạm Quang Thiện", fill=TEXT_MUTED, font=get_font(19))

    # Detailed AI Insights
    draw.text((rc_x + 36, rc_y + 300), "Đánh giá chi tiết từ mô hình AI:", fill=TEXT_DARK, font=get_font(22, bold=True))

    insights = [
        ("✓", GREEN_ACCENT, "Điểm mạnh", "Thành thạo TypeScript, NestJS, Prisma ORM và kiến trúc REST API."),
        ("✓", GREEN_ACCENT, "Cơ sở dữ liệu", "Thiết kế CSDL MySQL quan hệ chuẩn hóa 38 bảng, tối ưu query."),
        ("✓", GREEN_ACCENT, "Bảo mật & Phiên", "Xác thực JWT HttpOnly cookie, phân quyền RBAC 4 lớp nghiêm ngặt."),
        ("!", (234, 88, 12), "Khuyến nghị bổ sung", "Nên bổ sung chứng chỉ Docker, CI/CD GitHub Actions để tăng điểm cạnh tranh.")
    ]
    
    iy = rc_y + 345
    for icon, iclr, title, desc in insights:
        draw.rounded_rectangle([rc_x + 36, iy, rc_x + rc_w - 36, iy + 95], radius=14, fill=(248, 250, 252), outline=BORDER_COLOR, width=1)
        
        # Icon circle
        draw.ellipse([rc_x + 52, iy + 22, rc_x + 92, iy + 62], fill=(255, 255, 255), outline=iclr, width=2)
        draw.text((rc_x + 64, iy + 26), icon, fill=iclr, font=get_font(22, bold=True))
        
        draw.text((rc_x + 108, iy + 14), title, fill=TEXT_DARK, font=get_font(20, bold=True))
        draw.text((rc_x + 108, iy + 46), desc[:52] + "...", fill=TEXT_MUTED, font=get_font(18))
        iy += 115

    # Bottom button inside AI card
    draw.rounded_rectangle([rc_x + 36, rc_y + 800, rc_x + rc_w - 36, rc_y + 854], radius=14, fill=RED_PRIMARY)
    draw.text((rc_x + 180, rc_y + 814), "Nộp hồ sơ ngay với CV này", fill=(255, 255, 255), font=get_font(22, bold=True))

    output_path = r"D:\TalentHub\main_hero_mockup.png"
    img.save(output_path, "PNG")
    print(f"Created main hero mockup: {output_path} ({w}x{h})")

# -------------------------------------------------------------------------
# 2. SECONDARY FEATURES MOCKUP (1448 x 496 px)
# (Left: CV Builder & Upload, Right: Company Wallet & VNPAY)
# -------------------------------------------------------------------------
def create_secondary_features():
    w, h = 1448, 496
    img = Image.new("RGB", (w, h), (255, 255, 255))
    draw = ImageDraw.Draw(img)

    half_w = (w - 32) // 2
    
    # --- LEFT CARD: CV BUILDER & UPLOAD ---
    cx1 = 0
    draw.rounded_rectangle([cx1, 0, cx1 + half_w, h - 56], radius=20, fill=(248, 250, 252), outline=BORDER_COLOR, width=2)
    # Header mini bar
    draw.rounded_rectangle([cx1, 0, cx1 + half_w, 56], radius=20, fill=(241, 245, 249))
    draw.rectangle([cx1, 30, cx1 + half_w, 56], fill=(241, 245, 249))
    draw.text((cx1 + 24, 14), "📄  Quản lý CV: Trực tuyến & Tải tệp PDF/DOCX", fill=TEXT_DARK, font=get_font(20, bold=True))

    # Inside left card
    # CV Preview mockup
    draw.rounded_rectangle([cx1 + 24, 76, cx1 + 320, h - 80], radius=12, fill=(255, 255, 255), outline=BORDER_COLOR, width=1)
    draw.ellipse([cx1 + 44, 94, cx1 + 94, 144], fill=BLUE_ACCENT)
    draw.text((cx1 + 60, 102), "T", fill=(255, 255, 255), font=get_font(28, bold=True))
    draw.text((cx1 + 110, 100), "Nguyễn P. Q. Thiện", fill=TEXT_DARK, font=get_font(18, bold=True))
    draw.text((cx1 + 110, 126), "Software Engineer", fill=RED_PRIMARY, font=get_font(15))
    
    # Mini CV text lines
    draw.line([(cx1 + 44, 160), (cx1 + 300, 160)], fill=BORDER_COLOR, width=2)
    for ly in [180, 206, 232, 258, 284, 310, 336, 362]:
        draw.rounded_rectangle([cx1 + 44, ly, cx1 + 280 - (ly % 70), ly + 14], radius=6, fill=(226, 232, 240))
        
    # Right side of Left card: Controls
    rx = cx1 + 344
    draw.text((rx, 80), "Chế độ CV Kép:", fill=TEXT_DARK, font=get_font(19, bold=True))
    
    draw.rounded_rectangle([rx, 115, cx1 + half_w - 24, 180], radius=10, fill=(255, 255, 255), outline=BLUE_ACCENT, width=2)
    draw.text((rx + 16, 125), "✓  CV Builder trực tuyến", fill=BLUE_ACCENT, font=get_font(17, bold=True))
    draw.text((rx + 16, 150), "Tùy biến học vấn, kinh nghiệm, kỹ năng", fill=TEXT_MUTED, font=get_font(14))

    draw.rounded_rectangle([rx, 195, cx1 + half_w - 24, 260], radius=10, fill=(255, 255, 255), outline=BORDER_COLOR, width=1)
    draw.text((rx + 16, 205), "📁  Tải tệp CV (PDF/DOCX)", fill=TEXT_DARK, font=get_font(17, bold=True))
    draw.text((rx + 16, 230), "Kiểm tra magic bytes, lưu trữ Cloudinary", fill=TEXT_MUTED, font=get_font(14))

    draw.rounded_rectangle([rx, 275, cx1 + half_w - 24, 340], radius=10, fill=(255, 255, 255), outline=BORDER_COLOR, width=1)
    draw.text((rx + 16, 285), "⚡  Snapshot khi ứng tuyển", fill=GREEN_ACCENT, font=get_font(17, bold=True))
    draw.text((rx + 16, 310), "Lưu phiên bản cố định CvVersion", fill=TEXT_MUTED, font=get_font(14))

    # Pill below left card
    draw.rounded_rectangle([cx1 + half_w // 4, h - 46, cx1 + 3 * half_w // 4, h - 6], radius=20, fill=RED_PRIMARY)
    draw.text((cx1 + half_w // 4 + 40, h - 38), "Quản lý CV & AI hỗ trợ", fill=(255, 255, 255), font=get_font(20, bold=True))

    # --- RIGHT CARD: COMPANY WALLET & VNPAY ---
    cx2 = half_w + 32
    draw.rounded_rectangle([cx2, 0, cx2 + half_w, h - 56], radius=20, fill=(248, 250, 252), outline=BORDER_COLOR, width=2)
    # Header mini bar
    draw.rounded_rectangle([cx2, 0, cx2 + half_w, 56], radius=20, fill=(241, 245, 249))
    draw.rectangle([cx2, 30, cx2 + half_w, 56], fill=(241, 245, 249))
    draw.text((cx2 + 24, 14), "💳  Ví công ty & Cổng thanh toán VNPAY", fill=TEXT_DARK, font=get_font(20, bold=True))

    # Inside right card
    # Wallet Balance Box
    draw.rounded_rectangle([cx2 + 24, 76, cx2 + 320, 210], radius=14, fill=RED_PRIMARY)
    draw.text((cx2 + 44, 94), "Số dư khả dụng:", fill=(254, 202, 202), font=get_font(17))
    draw.text((cx2 + 44, 124), "5.250.000 đ", fill=(255, 255, 255), font=get_font(32, bold=True))
    draw.text((cx2 + 44, 172), "+ Nạp tiền qua VNPAY Gateway", fill=(255, 255, 255), font=get_font(15, bold=True))

    # Package features
    draw.rounded_rectangle([cx2 + 24, 226, cx2 + 320, h - 80], radius=14, fill=(255, 255, 255), outline=BORDER_COLOR, width=1)
    draw.text((cx2 + 44, 240), "Gói dịch vụ đã mua:", fill=TEXT_DARK, font=get_font(17, bold=True))
    draw.text((cx2 + 44, 270), "• Tin tuyển dụng nổi bật (TOP 1)", fill=BLUE_ACCENT, font=get_font(15))
    draw.text((cx2 + 44, 298), "• Huy hiệu Verified Company", fill=GREEN_ACCENT, font=get_font(15))
    draw.text((cx2 + 44, 326), "• Đăng tin không giới hạn 30 ngày", fill=TEXT_MUTED, font=get_font(15))
    draw.text((cx2 + 44, 354), "• Hỗ trợ đẩy tin tự động hàng tuần", fill=TEXT_MUTED, font=get_font(15))

    # VNPAY Checkout dialog mockup
    rx2 = cx2 + 344
    draw.rounded_rectangle([rx2, 76, cx2 + half_w - 24, h - 80], radius=14, fill=(255, 255, 255), outline=BORDER_COLOR, width=1)
    draw.rounded_rectangle([rx2 + 20, 94, rx2 + 100, 134], radius=8, fill=(238, 242, 255))
    draw.text((rx2 + 26, 104), "VNPAY", fill=BLUE_ACCENT, font=get_font(18, bold=True))
    draw.text((rx2 + 115, 102), "Cổng thanh toán", fill=TEXT_DARK, font=get_font(18, bold=True))
    
    # Mini QR code in VNPAY
    draw.rounded_rectangle([rx2 + 20, 150, rx2 + 140, 270], radius=8, fill=(241, 245, 249), outline=BORDER_COLOR, width=1)
    draw.text((rx2 + 35, 200), "[QR PAY]", fill=TEXT_MUTED, font=get_font(16, bold=True))
    
    draw.text((rx2 + 155, 160), "Quét mã VNPAY-QR", fill=TEXT_DARK, font=get_font(16, bold=True))
    draw.text((rx2 + 155, 190), "Hỗ trợ 40+ ngân hàng", fill=TEXT_MUTED, font=get_font(14))
    draw.text((rx2 + 155, 215), "Giao dịch bảo mật IPN", fill=GREEN_ACCENT, font=get_font(14, bold=True))
    
    draw.rounded_rectangle([rx2 + 20, 295, cx2 + half_w - 44, 350], radius=10, fill=GREEN_ACCENT)
    draw.text((rx2 + 50, 312), "✓ Xác nhận thanh toán thành công", fill=(255, 255, 255), font=get_font(17, bold=True))

    # Pill below right card
    draw.rounded_rectangle([cx2 + half_w // 4, h - 46, cx2 + 3 * half_w // 4, h - 6], radius=20, fill=RED_PRIMARY)
    draw.text((cx2 + half_w // 4 + 40, h - 38), "Ví doanh nghiệp & VNPAY", fill=(255, 255, 255), font=get_font(20, bold=True))

    output_path = r"D:\TalentHub\secondary_features_mockup.png"
    img.save(output_path, "PNG")
    print(f"Created secondary features mockup: {output_path} ({w}x{h})")

# -------------------------------------------------------------------------
# 3. SYSTEM ARCHITECTURE DIAGRAM (2112 x 720 px)
# (Clean vector flowchart matching section 3)
# -------------------------------------------------------------------------
def create_architecture_diagram():
    w, h = 2112, 720
    img = Image.new("RGB", (w, h), (255, 255, 255))
    draw = ImageDraw.Draw(img)

    # Subtle border
    draw.rounded_rectangle([0, 0, w - 1, h - 1], radius=20, fill=(255, 255, 255), outline=BORDER_COLOR, width=2)

    # 3 Main Columns: Clients -> Backend Gateway & Logic -> Data & External Services
    col_w = 600
    col_gap = 96
    start_x = 76

    # Column 1: CLIENTS & ROLES
    c1_x = start_x
    draw.rounded_rectangle([c1_x, 36, c1_x + col_w, 320], radius=16, fill=(248, 250, 252), outline=BORDER_COLOR, width=2)
    # Header
    draw.rounded_rectangle([c1_x, 36, c1_x + col_w, 90], radius=16, fill=RED_LIGHT)
    draw.rectangle([c1_x, 60, c1_x + col_w, 90], fill=RED_LIGHT)
    draw.text((c1_x + 24, 48), "👥  NGƯỜI DÙNG & GIAO DIỆN CLIENT", fill=RED_DARK, font=get_font(22, bold=True))

    draw.text((c1_x + 24, 110), "4 Vai trò người dùng (RBAC):", fill=TEXT_DARK, font=get_font(20, bold=True))
    draw.text((c1_x + 24, 145), "• Ứng viên (Sinh viên / Người tìm việc)", fill=TEXT_MUTED, font=get_font(18))
    draw.text((c1_x + 24, 178), "• Nhà tuyển dụng (Doanh nghiệp đăng tin, xem CV)", fill=TEXT_MUTED, font=get_font(18))
    draw.text((c1_x + 24, 211), "• Nhân viên vận hành (STAFF kiểm duyệt)", fill=TEXT_MUTED, font=get_font(18))
    draw.text((c1_x + 24, 244), "• Quản trị hệ thống (SUPER_ADMIN cấu hình)", fill=TEXT_MUTED, font=get_font(18))
    
    # Framework Pill inside Client
    draw.rounded_rectangle([c1_x + 24, 276, c1_x + col_w - 24, 308], radius=8, fill=(238, 242, 255))
    draw.text((c1_x + 40, 280), "Next.js 15 SPA (App Router, Tailwind CSS) · Triển khai Vercel", fill=BLUE_ACCENT, font=get_font(17, bold=True))

    # Box 1B: External Services & Integrations (Below Col 1)
    draw.rounded_rectangle([c1_x, 360, c1_x + col_w, h - 36], radius=16, fill=(248, 250, 252), outline=BORDER_COLOR, width=2)
    draw.rounded_rectangle([c1_x, 360, c1_x + col_w, 414], radius=16, fill=(241, 245, 249))
    draw.rectangle([c1_x, 390, c1_x + col_w, 414], fill=(241, 245, 249))
    draw.text((c1_x + 24, 374), "🔌  DỊCH VỤ TÍCH HỢP BÊN NGOÀI", fill=TEXT_DARK, font=get_font(22, bold=True))

    ext_services = [
        ("Cổng VNPAY", "Thanh toán nạp ví doanh nghiệp, IPN callback checksum"),
        ("Google Gemini AI", "Phân tích JD–CV, tính điểm match & đề xuất cải thiện"),
        ("Cloudinary", "Lưu trữ tệp CV (PDF/DOCX) riêng tư, logo công ty"),
        ("Socket.IO", "Kênh chat trao đổi trực tiếp giữa SV và Nhà tuyển dụng")
    ]
    ey = 430
    for s_name, s_desc in ext_services:
        draw.text((c1_x + 24, ey), f"• {s_name}:", fill=RED_PRIMARY, font=get_font(18, bold=True))
        draw.text((c1_x + 180, ey), s_desc[:44] + "...", fill=TEXT_MUTED, font=get_font(17))
        ey += 66

    # Column 2: BACKEND API & BUSINESS LOGIC
    c2_x = c1_x + col_w + col_gap
    draw.rounded_rectangle([c2_x, 36, c2_x + col_w, h - 36], radius=16, fill=(248, 250, 252), outline=RED_PRIMARY, width=3)
    # Header
    draw.rounded_rectangle([c2_x, 36, c2_x + col_w, 96], radius=16, fill=RED_PRIMARY)
    draw.rectangle([c2_x, 60, c2_x + col_w, 96], fill=RED_PRIMARY)
    draw.text((c2_x + 24, 50), "⚡  HỆ THỐNG BACKEND API (NestJS 11)", fill=(255, 255, 255), font=get_font(24, bold=True))

    api_sections = [
        ("Kiến trúc Module hóa", "27 Modules, 23 Controllers, 128 Endpoints chuẩn RESTful"),
        ("Xác thực & Bảo mật", "JWT Access/Refresh token (HttpOnly cookie), Argon2 hash password"),
        ("Kiểm soát truy cập (RBAC)", "JwtAuthGuard, RolesGuard kiểm tra quyền 4 cấp độ nghiêm ngặt"),
        ("Máy trạng thái (State Machine)", "Quản lý vòng đời tin JobStatus & đơn ứng tuyển ApplicationStatus"),
        ("Kiểm tra định dạng tệp", "Magic bytes check (chặn file độc hại giả mạo PDF/DOCX)"),
        ("Tài liệu & Triển khai", "OpenAPI Swagger UI tự động tại /api/docs · Triển khai Render")
    ]
    ay = 115
    for a_title, a_desc in api_sections:
        draw.rounded_rectangle([c2_x + 20, ay, c2_x + col_w - 20, ay + 82], radius=12, fill=(255, 255, 255), outline=BORDER_COLOR, width=1)
        draw.text((c2_x + 36, ay + 12), a_title, fill=TEXT_DARK, font=get_font(19, bold=True))
        draw.text((c2_x + 36, ay + 44), a_desc, fill=TEXT_MUTED, font=get_font(17))
        ay += 92

    # Column 3: DATA & STORAGE
    c3_x = c2_x + col_w + col_gap
    draw.rounded_rectangle([c3_x, 36, c3_x + col_w, h - 36], radius=16, fill=(248, 250, 252), outline=BORDER_COLOR, width=2)
    # Header
    draw.rounded_rectangle([c3_x, 36, c3_x + col_w, 90], radius=16, fill=(238, 242, 255))
    draw.rectangle([c3_x, 60, c3_x + col_w, 90], fill=(238, 242, 255))
    draw.text((c3_x + 24, 48), "🗄️  CƠ SỞ DỮ LIỆU & LƯU TRỮ", fill=BLUE_ACCENT, font=get_font(22, bold=True))

    draw.text((c3_x + 24, 110), "MySQL 8.0 & Prisma ORM:", fill=TEXT_DARK, font=get_font(20, bold=True))
    
    db_groups = [
        ("Người dùng & Hồ sơ", "User, RefreshToken, StudentProfile, CompanyProfile, StaffProfile"),
        ("Tin tuyển dụng & Ứng tuyển", "Job, JobStatusHistory, Application, Cv, CvVersion, SavedJob"),
        ("Ví & Thanh toán VNPAY", "CompanyWallet, WalletTransaction, Order, PaymentTransaction, Quota"),
        ("Quản trị & Moderation", "ModerationLog, UserReport, Expense, AuditLog, PostingFeeConfig"),
        ("Giao tiếp & Tương tác", "Conversation, Message, Notification, Review, CvAiAnalysis")
    ]
    dy = 150
    for g_title, g_models in db_groups:
        draw.rounded_rectangle([c3_x + 20, dy, c3_x + col_w - 20, dy + 84], radius=10, fill=(255, 255, 255), outline=BORDER_COLOR, width=1)
        draw.text((c3_x + 36, dy + 12), g_title, fill=RED_PRIMARY, font=get_font(18, bold=True))
        draw.text((c3_x + 36, dy + 44), g_models[:50] + "...", fill=TEXT_MUTED, font=get_font(16))
        dy += 96

    # Bottom summary in Col 3
    draw.rounded_rectangle([c3_x + 20, h - 86, c3_x + col_w - 20, h - 46], radius=10, fill=GREEN_ACCENT)
    draw.text((c3_x + 130, h - 74), "Tổng cộng: 38 Models · 31 Enums", fill=(255, 255, 255), font=get_font(19, bold=True))

    # Flow Arrows connecting Col 1 -> Col 2 -> Col 3
    # Arrow 1: Col 1 -> Col 2
    arr1_x = c1_x + col_w + 14
    draw.line([(arr1_x, 180), (arr1_x + 65, 180)], fill=RED_PRIMARY, width=6)
    draw.polygon([(arr1_x + 65, 170), (arr1_x + 85, 180), (arr1_x + 65, 190)], fill=RED_PRIMARY)
    draw.text((arr1_x + 8, 142), "HTTPS", fill=RED_PRIMARY, font=get_font(16, bold=True))

    draw.line([(arr1_x, 480), (arr1_x + 65, 480)], fill=BLUE_ACCENT, width=6)
    draw.polygon([(arr1_x + 65, 470), (arr1_x + 85, 480), (arr1_x + 65, 490)], fill=BLUE_ACCENT)
    draw.text((arr1_x + 10, 442), "WebHook", fill=BLUE_ACCENT, font=get_font(16, bold=True))

    # Arrow 2: Col 2 -> Col 3
    arr2_x = c2_x + col_w + 14
    draw.line([(arr2_x, 320), (arr2_x + 65, 320)], fill=BLUE_ACCENT, width=6)
    draw.polygon([(arr2_x + 65, 310), (arr2_x + 85, 320), (arr2_x + 65, 330)], fill=BLUE_ACCENT)
    draw.text((arr2_x + 6, 282), "Prisma", fill=BLUE_ACCENT, font=get_font(16, bold=True))

    output_path = r"D:\TalentHub\architecture_diagram_mockup.png"
    img.save(output_path, "PNG")
    print(f"Created architecture diagram: {output_path} ({w}x{h})")

# -------------------------------------------------------------------------
# 4. TESTING CHART & EVALUATION (2112 x 816 px)
# (Matching Section 4 with horizontal bar chart + evaluation text)
# -------------------------------------------------------------------------
def create_testing_chart():
    w, h = 2112, 816
    img = Image.new("RGB", (w, h), (255, 255, 255))
    draw = ImageDraw.Draw(img)

    # Subtle border
    draw.rounded_rectangle([0, 0, w - 1, h - 1], radius=20, fill=(255, 255, 255), outline=BORDER_COLOR, width=2)

    # Left: Horizontal Bar Chart of Test Cases by Role
    chart_w = 980
    draw.text((48, 36), "Tỉ lệ test case đạt theo phân hệ vai trò", fill=TEXT_DARK, font=get_font(26, bold=True))
    draw.text((48, 76), "Tổng hợp từ 121 test case trong bộ kiểm thử dự án TalentHub", fill=TEXT_MUTED, font=get_font(19))

    bars = [
        ("Khách (Chưa đăng nhập)", 96.0, "15/15 test case đạt (Xem tin, tìm kiếm, đăng ký/đăng nhập)"),
        ("Ứng viên (Sinh viên)", 94.5, "35/37 test case đạt (Hồ sơ, CV builder/upload, ứng tuyển, AI)"),
        ("Nhà tuyển dụng (Company)", 92.8, "32/34 test case đạt (Đăng tin, duyệt ứng viên, ví tiền, VNPAY)"),
        ("Quản trị (Staff & Admin)", 91.5, "22/24 test case đạt (Duyệt tin, xác minh công ty, báo cáo, giá)"),
        ("Tích hợp & API / E2E", 95.0, "19/20 test case đạt (JWT, RBAC, magic bytes, health check)")
    ]

    by = 130
    bar_max_w = 540
    for label, pct, desc in bars:
        # Label
        draw.text((48, by), label, fill=TEXT_DARK, font=get_font(21, bold=True))
        
        # Background bar
        draw.rounded_rectangle([320, by - 4, 320 + bar_max_w, by + 32], radius=10, fill=(241, 245, 249))
        
        # Filled bar (Red)
        fill_w = int(bar_max_w * (pct / 100.0))
        draw.rounded_rectangle([320, by - 4, 320 + fill_w, by + 32], radius=10, fill=RED_PRIMARY)
        
        # Percentage text
        draw.text((320 + fill_w + 18, by + 2), f"{pct:.1f}%", fill=RED_DARK, font=get_font(22, bold=True))
        
        # Description below bar
        draw.text((48, by + 38), desc, fill=TEXT_MUTED, font=get_font(17))
        by += 86

    # Middle Divider Line
    draw.line([(chart_w + 40, 36), (chart_w + 40, h - 36)], fill=BORDER_COLOR, width=2)

    # Right: Testing & Quality Assurance Summary
    rx = chart_w + 90
    draw.text((rx, 36), "KIỂM THỬ HỆ THỐNG & ĐÁNH GIÁ CHẤT LƯỢNG", fill=RED_PRIMARY, font=get_font(26, bold=True))

    items = [
        ("Bộ kiểm thử thiết kế:", "121 test case bao phủ toàn diện 10 phân hệ chức năng và phi chức năng (SRS trace). Đã thực hiện kiểm thử chức năng (GUI + API) và kiểm thử tích hợp luồng nghiệp vụ."),
        ("Môi trường thử nghiệm:", "Thử nghiệm trên Chrome Desktop (1920×1080) và Responsive Mobile (390×844). API kiểm thử tự động với Jest Unit Test và Postman Test Collection."),
        ("Bảo mật & Độ tin cậy:", "Xác thực JWT kép (access token ngắn hạn + refresh token trong HttpOnly cookie chống XSS), mã hóa mật khẩu Argon2 chuẩn OWASP, phân quyền 4 vai trò qua Guards."),
        ("An toàn tệp & Giao dịch:", "Kiểm tra magic bytes tiêu đề tệp ngăn tải file giả mạo (.exe đổi tên thành .pdf); xác thực chữ ký số SHA256 IPN đối soát giao dịch thanh toán VNPAY.")
    ]

    ty = 90
    for header, body in items:
        draw.text((rx, ty), f"• {header}", fill=TEXT_DARK, font=get_font(21, bold=True))
        # Word wrap body text
        words = body.split()
        lines = []
        cur_line = ""
        for w_word in words:
            test_line = (cur_line + " " + w_word).strip()
            if len(test_line) > 58:
                lines.append(cur_line)
                cur_line = w_word
            else:
                cur_line = test_line
        if cur_line:
            lines.append(cur_line)
            
        ly = ty + 30
        for l in lines:
            draw.text((rx + 16, ly), l, fill=TEXT_MUTED, font=get_font(18))
            ly += 26
        ty = ly + 14

    output_path = r"D:\TalentHub\testing_chart_mockup.png"
    img.save(output_path, "PNG")
    print(f"Created testing chart: {output_path} ({w}x{h})")

if __name__ == "__main__":
    create_main_hero()
    create_secondary_features()
    create_architecture_diagram()
    create_testing_chart()

