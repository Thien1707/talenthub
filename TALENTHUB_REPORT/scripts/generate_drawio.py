# -*- coding: utf-8 -*-
"""Sinh file diagrams.net (.drawio) cho báo cáo TalentHub."""
from __future__ import annotations

import html
import uuid
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "diagrams"


def esc(text: str) -> str:
    return html.escape(text, quote=True)


class DrawioBuilder:
    def __init__(self, page_name: str = "Trang-1") -> None:
        self.page_name = page_name
        self._id = 2
        self.cells: list[str] = [
            '<mxCell id="0"/>',
            '<mxCell id="1" parent="0"/>',
        ]

    def _next_id(self) -> str:
        cid = str(self._id)
        self._id += 1
        return cid

    def rect(
        self,
        label: str,
        x: float,
        y: float,
        w: float,
        h: float,
        *,
        style: str = "rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;",
        parent: str = "1",
    ) -> str:
        cid = self._next_id()
        self.cells.append(
            f'<mxCell id="{cid}" value="{esc(label)}" style="{style}" vertex="1" parent="{parent}">'
            f'<mxGeometry x="{x}" y="{y}" width="{w}" height="{h}" as="geometry"/></mxCell>'
        )
        return cid

    def ellipse(
        self,
        label: str,
        x: float,
        y: float,
        w: float,
        h: float,
        *,
        style: str = "ellipse;whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#d6b656;",
        parent: str = "1",
    ) -> str:
        cid = self._next_id()
        self.cells.append(
            f'<mxCell id="{cid}" value="{esc(label)}" style="{style}" vertex="1" parent="{parent}">'
            f'<mxGeometry x="{x}" y="{y}" width="{w}" height="{h}" as="geometry"/></mxCell>'
        )
        return cid

    def actor(self, label: str, x: float, y: float, parent: str = "1") -> str:
        style = (
            "shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;"
            "outlineConnect=0;fillColor=#f5f5f5;strokeColor=#666666;"
        )
        cid = self._next_id()
        self.cells.append(
            f'<mxCell id="{cid}" value="{esc(label)}" style="{style}" vertex="1" parent="{parent}">'
            f'<mxGeometry x="{x}" y="{y}" width="40" height="80" as="geometry"/></mxCell>'
        )
        return cid

    def cylinder(self, label: str, x: float, y: float, w: float = 120, h: float = 80) -> str:
        style = "shape=cylinder3;whiteSpace=wrap;html=1;boundedLbl=1;backgroundOutline=1;size=15;fillColor=#e1d5e7;strokeColor=#9673a6;"
        return self.rect(label, x, y, w, h, style=style)

    def container(
        self, label: str, x: float, y: float, w: float, h: float, dashed: bool = False
    ) -> str:
        dash = "dashed=1;" if dashed else ""
        style = (
            f"swimlane;whiteSpace=wrap;html=1;startSize=28;fillColor=#f8cecc;strokeColor=#b85450;{dash}"
        )
        return self.rect(label, x, y, w, h, style=style)

    def edge(
        self,
        source: str,
        target: str,
        *,
        label: str = "",
        dashed: bool = False,
        style_extra: str = "",
    ) -> None:
        cid = self._next_id()
        dash = "dashed=1;" if dashed else ""
        style = f"edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;{dash}{style_extra}"
        val = f' value="{esc(label)}"' if label else ""
        self.cells.append(
            f'<mxCell id="{cid}" style="{style}" edge="1" parent="1" source="{source}" target="{target}"{val}>'
            f'<mxGeometry relative="1" as="geometry"/></mxCell>'
        )

    def rhombus(self, label: str, x: float, y: float, w: float = 120, h: float = 80) -> str:
        style = "rhombus;whiteSpace=wrap;html=1;fillColor=#ffe6cc;strokeColor=#d79b00;"
        return self.rect(label, x, y, w, h, style=style)

    def terminator(self, label: str, x: float, y: float) -> str:
        style = "strokeWidth=2;html=1;shape=mxgraph.flowchart.start_1;whiteSpace=wrap;fillColor=#d5e8d4;strokeColor=#82b366;"
        return self.rect(label, x, y, 100, 50, style=style)

    def seq_participant(self, label: str, x: float) -> str:
        return self.rect(label, x, 40, 110, 40, style="rounded=0;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;")

    def seq_lifeline(self, x: float, top_participant_id: str) -> str:
        """Vertical dashed line (as edge from participant downward) — use thin rect."""
        cid = self._next_id()
        self.cells.append(
            f'<mxCell id="{cid}" value="" style="endArrow=none;dashed=1;html=1;strokeWidth=1;" edge="1" parent="1" source="{top_participant_id}">'
            f'<mxGeometry x="{x + 55}" y="90" width="0" height="320" as="geometry">'
            f'<mxPoint x="{x + 55}" y="90" as="sourcePoint"/>'
            f'<mxPoint x="{x + 55}" y="410" as="targetPoint"/></mxGeometry></mxCell>'
        )
        return cid

    def seq_message(self, x1: float, x2: float, y: float, label: str, dashed: bool = False) -> None:
        cid = self._next_id()
        dash = "dashed=1;" if dashed else ""
        style = f"endArrow=block;html=1;{dash}strokeWidth=1;"
        self.cells.append(
            f'<mxCell id="{cid}" value="{esc(label)}" style="{style}" edge="1" parent="1">'
            f'<mxGeometry relative="1" as="geometry">'
            f'<mxPoint x="{x1}" y="{y}" as="sourcePoint"/>'
            f'<mxPoint x="{x2}" y="{y}" as="targetPoint"/></mxGeometry></mxCell>'
        )

    def build(self) -> str:
        body = "\n        ".join(self.cells)
        diag_id = uuid.uuid4().hex[:8]
        return f"""<mxfile host="app.diagrams.net" modified="2026-11-01T00:00:00.000Z" agent="TalentHub" version="22.1.0" type="device">
  <diagram name="{esc(self.page_name)}" id="{diag_id}">
    <mxGraphModel dx="1200" dy="800" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1169" pageHeight="827" math="0" shadow="0">
      <root>
        {body}
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
"""


def write(name: str, xml: str) -> Path:
    path = OUT_DIR / f"{name}.drawio"
    path.write_text(xml, encoding="utf-8")
    return path


def diagram_use_case_overall() -> None:
    b = DrawioBuilder("Use Case tổng quát")
    sys_id = b.container("Hệ thống TalentHub", 180, 60, 720, 420)
    ucs = []
    labels = [
        "Đăng ký / Đăng nhập",
        "Quản lý hồ sơ",
        "Tìm việc / Ứng tuyển",
        "Quản lý CV",
        "Đăng tin / Duyệt tin",
        "Ví & VNPAY",
        "Tin nhắn realtime",
        "Thông báo",
        "Phân tích CV AI",
        "Quản trị hệ thống",
    ]
    xs = [220, 400, 580, 220, 400, 580, 220, 400, 580, 400]
    ys = [110, 110, 110, 210, 210, 210, 310, 310, 310, 400]
    for i, lab in enumerate(labels):
        ucs.append(b.ellipse(lab, xs[i], ys[i], 150, 55, parent=sys_id))

    a_sv = b.actor("Ứng viên\nSTUDENT", 40, 180)
    a_ntd = b.actor("NTD\nCOMPANY", 40, 320)
    a_st = b.actor("STAFF", 960, 180)
    a_ad = b.actor("SUPER\nADMIN", 960, 320)

    for i in [0, 1, 2, 3, 6, 7, 8]:
        b.edge(a_sv, ucs[i])
    for i in [0, 1, 4, 5, 2, 6, 7, 8]:
        b.edge(a_ntd, ucs[i])
    for i in [0, 4, 9]:
        b.edge(a_st, ucs[i])
    for i in [0, 9, 5]:
        b.edge(a_ad, ucs[i])

    write("use_case_overall", b.build())


def diagram_use_case_list(name: str, actor_label: str, cases: list[str], cols: int = 2) -> None:
    b = DrawioBuilder(actor_label)
    sys_id = b.container(f"Chức năng — {actor_label}", 140, 50, 520, 40 + 70 * ((len(cases) + cols - 1) // cols))
    actor = b.actor(actor_label.split("\n")[0], 40, 120)
    ids = []
    for idx, c in enumerate(cases):
        row, col = divmod(idx, cols)
        ids.append(b.ellipse(c, 160 + col * 250, 100 + row * 70, 220, 55, parent=sys_id))
    for uid in ids:
        b.edge(actor, uid)
    write(name, b.build())


def diagram_use_case_admin() -> None:
    b = DrawioBuilder("Use Case quản trị")
    st = b.actor("STAFF", 40, 140)
    ad = b.actor("SUPER\nADMIN", 40, 340)
    s_id = b.container("Nhân viên vận hành", 160, 80, 480, 200)
    staff_cases = [
        "Duyệt / Từ chối tin",
        "Xác minh công ty",
        "Xử lý báo cáo",
        "Kiểm duyệt đánh giá",
        "Nhật ký moderation",
    ]
    s_nodes = []
    for i, c in enumerate(staff_cases):
        s_nodes.append(b.ellipse(c, 180 + (i % 2) * 220, 120 + (i // 2) * 65, 200, 50, parent=s_id))
    a_id = b.container("Quản trị hệ thống", 160, 300, 480, 220)
    admin_cases = [
        "Quản lý tài khoản",
        "Quản lý nhân viên",
        "Bảng giá / phí đăng tin",
        "Danh mục ngành",
        "Quản lý chi phí",
        "Thống kê tổng quan",
    ]
    a_nodes = []
    for i, c in enumerate(admin_cases):
        a_nodes.append(b.ellipse(c, 180 + (i % 2) * 220, 340 + (i // 2) * 65, 200, 50, parent=a_id))
    for n in s_nodes:
        b.edge(st, n)
    for n in a_nodes:
        b.edge(ad, n)
    write("use_case_admin", b.build())


def diagram_architecture() -> None:
    b = DrawioBuilder("Kiến trúc triển khai")
    c_id = b.container("Client", 40, 40, 200, 120)
    web = b.rect("Next.js 15\n(Vercel)", 60, 90, 160, 55, parent=c_id)
    a_id = b.container("Backend (Render)", 280, 40, 280, 200)
    nest = b.rect("NestJS 11\nREST /api/v1", 300, 90, 120, 50, parent=a_id)
    ws = b.rect("Socket.IO\n/chat", 440, 90, 100, 50, parent=a_id)
    auth = b.rect("JWT + Refresh Cookie", 300, 160, 240, 45, parent=a_id)
    d_id = b.container("Dữ liệu & Dịch vụ", 600, 40, 320, 200)
    mysql = b.cylinder("MySQL\nPrisma", 620, 90)
    cld = b.rect("Cloudinary\nCV/Logo", 760, 90, 140, 50, parent=d_id)
    gem = b.rect("Gemini API", 620, 160, 120, 45, parent=d_id)
    vnp = b.rect("VNPAY", 760, 160, 140, 45, parent=d_id)

    b.edge(web, nest, label="HTTPS REST")
    b.edge(web, ws, label="WSS")
    b.edge(nest, mysql)
    b.edge(nest, cld)
    b.edge(nest, gem)
    b.edge(nest, vnp)
    b.edge(ws, nest)
    b.edge(nest, auth, style_extra="endArrow=none;")
    write("system_architecture", b.build())


def diagram_activity_application() -> None:
    b = DrawioBuilder("Activity — Ứng tuyển")
    start = b.terminator("Bắt đầu", 340, 40)
    a = b.rect("Đăng nhập STUDENT", 300, 110, 180, 45)
    d1 = b.rhombus("Đã có CV?", 310, 180)
    c = b.rect("Tạo CV / upload", 120, 260, 160, 45)
    d_save = b.rect("Lưu CvVersion", 120, 330, 160, 45)
    e = b.rect("Mở chi tiết tin", 300, 260, 180, 45)
    f = b.rect("Chọn CV", 300, 330, 180, 45)
    g = b.rect("POST /applications", 300, 400, 180, 45)
    d2 = b.rhombus("Hợp lệ?", 310, 470)
    err = b.rect("Thông báo lỗi", 520, 480, 140, 45)
    j = b.rect("Application SUBMITTED", 300, 560, 180, 45)
    k = b.rect("Notification NTD", 300, 630, 180, 45)
    end = b.terminator("Kết thúc", 340, 710)

    b.edge(start, a)
    b.edge(a, d1)
    b.edge(d1, c, label="Không")
    b.edge(c, d_save)
    b.edge(d_save, e)
    b.edge(d1, e, label="Có")
    b.edge(e, f)
    b.edge(f, g)
    b.edge(g, d2)
    b.edge(d2, err, label="Không")
    b.edge(d2, j, label="Có")
    b.edge(j, k)
    b.edge(k, end)
    b.edge(err, end)
    write("activity_job_application", b.build())


def diagram_activity_posting() -> None:
    b = DrawioBuilder("Activity — Đăng tin NTD")
    start = b.terminator("Bắt đầu", 340, 40)
    steps = [
        (110, "Đăng nhập COMPANY"),
        (180, "Tạo tin DRAFT"),
        (250, "Chọn gói quảng bá"),
        (320, "Tính phí quota / ví"),
    ]
    ids = [start]
    prev = start
    for y, lab in steps:
        nid = b.rect(lab, 280, y, 200, 45)
        b.edge(prev, nid)
        prev = nid
    d = b.rhombus("Ví đủ?", 310, 390)
    b.edge(prev, d)
    f = b.rect("Nạp VNPAY / hủy", 520, 400, 160, 45)
    g = b.rect("Trừ ví / WalletTx", 280, 480, 200, 45)
    h = b.rect("JobPublishRequest OK", 280, 550, 200, 45)
    i = b.rect("Tin PENDING", 280, 620, 200, 45)
    j = b.rect("STAFF duyệt", 280, 690, 200, 45)
    k = b.rect("Hiển thị /viec-lam", 280, 760, 200, 45)
    end = b.terminator("Kết thúc", 340, 830)
    b.edge(d, f, label="Không")
    b.edge(d, g, label="Có")
    b.edge(g, h)
    b.edge(h, i)
    b.edge(i, j)
    b.edge(j, k)
    b.edge(k, end)
    b.edge(f, end)
    write("activity_job_posting", b.build())


def diagram_sequence(name: str, title: str, participants: list[str], messages: list[tuple]) -> None:
    """messages: (from_idx, to_idx, label, dashed?)"""
    b = DrawioBuilder(title)
    xs = [80 + i * 180 for i in range(len(participants))]
    pids = []
    for i, p in enumerate(participants):
        pids.append(b.seq_participant(p, xs[i]))
    y = 120
    for item in messages:
        fi, ti, lab = item[0], item[1], item[2]
        dashed = item[3] if len(item) > 3 else False
        x1 = xs[fi] + 55
        x2 = xs[ti] + 55
        if fi > ti:
            x1, x2 = x2, x1
        b.seq_message(x1, x2, y, lab, dashed=dashed)
        y += 45
    write(name, b.build())


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    diagram_use_case_overall()
    diagram_use_case_list(
        "use_case_candidate",
        "Ứng viên\nSTUDENT",
        [
            "Đăng ký sinh viên",
            "Đăng nhập / Refresh JWT",
            "Cập nhật hồ sơ",
            "Tạo CV builder",
            "Upload CV PDF/DOC",
            "Xem / Xóa CV",
            "Tìm kiếm việc",
            "Lưu tin",
            "Nộp ứng tuyển",
            "Theo dõi trạng thái",
            "Chat NTD",
            "Thông báo",
            "Phân tích AI CV",
        ],
        cols=2,
    )
    diagram_use_case_list(
        "use_case_employer",
        "NTD\nCOMPANY",
        [
            "Đăng ký công ty",
            "Hồ sơ / Logo",
            "Tạo tin",
            "Đăng tin + gói",
            "Quản lý tin",
            "Xem CV ứng viên",
            "Cập nhật trạng thái HS",
            "Nạp ví VNPAY",
            "Chat ứng viên",
            "AI job match",
            "Đánh giá ứng viên",
        ],
        cols=2,
    )
    diagram_use_case_admin()
    diagram_architecture()
    diagram_activity_application()
    diagram_activity_posting()
    diagram_sequence(
        "sequence_authentication",
        "Sequence — Xác thực",
        ["Trình duyệt", "Next.js", "NestJS Auth", "MySQL"],
        [
            (0, 1, "email / mật khẩu"),
            (1, 2, "POST /auth/login"),
            (2, 3, "argon2 verify"),
            (3, 2, "User hợp lệ", True),
            (2, 1, "accessToken + Set-Cookie refresh"),
            (1, 1, "Lưu accessToken"),
            (1, 2, "GET /auth/me (Bearer)"),
            (1, 2, "POST /auth/refresh (cookie)"),
            (2, 3, "Kiểm tra RefreshToken"),
            (2, 1, "accessToken mới"),
        ],
    )
    diagram_sequence(
        "sequence_application",
        "Sequence — Ứng tuyển",
        ["Ứng viên", "Frontend", "ApplicationsService", "MySQL", "Notifications"],
        [
            (0, 1, "Chọn CV + Nộp"),
            (1, 2, "POST /applications"),
            (2, 3, "Job APPROVED?"),
            (2, 3, "CvVersion hợp lệ"),
            (2, 3, "INSERT Application"),
            (2, 4, "NEW_APPLICATION"),
            (2, 1, "201 Created"),
            (1, 0, "Toast thành công", True),
        ],
    )
    diagram_sequence(
        "sequence_payment",
        "Sequence — VNPAY",
        ["NTD", "Frontend", "PaymentsService", "VNPAY", "MySQL"],
        [
            (0, 1, "Nạp ví"),
            (1, 2, "Order WALLET_TOPUP"),
            (2, 4, "Order + PaymentTx"),
            (2, 3, "Redirect URL"),
            (3, 0, "Cổng thanh toán", True),
            (0, 3, "Thanh toán"),
            (3, 2, "IPN / Return"),
            (2, 4, "SUCCESS + cộng ví"),
            (2, 1, "/thanh-toan/ket-qua", True),
        ],
    )
    diagram_sequence(
        "sequence_messaging",
        "Sequence — Chat realtime",
        ["User A", "Frontend", "ChatGateway", "ConversationsService", "MySQL", "User B"],
        [
            (0, 1, "Kết nối WSS /chat"),
            (1, 2, "JWT auth"),
            (0, 1, "Gửi tin"),
            (1, 3, "POST .../messages"),
            (3, 4, "INSERT Message"),
            (3, 2, "message:new event"),
            (2, 1, "Broadcast", True),
            (1, 5, "Hiển thị realtime", True),
        ],
    )
    print(f"Đã tạo 11 file .drawio trong {OUT_DIR} (không gồm erd — chạy generate_erd_drawio.py)")


if __name__ == "__main__":
    main()
