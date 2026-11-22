# -*- coding: utf-8 -*-
"""Sinh erd.drawio — ERD dạng bảng cột (PK/FK) + quan hệ chân quạ, theo mẫu báo cáo."""
from __future__ import annotations

import html
from pathlib import Path

OUT = Path(__file__).resolve().parents[1] / "diagrams" / "erd.drawio"


class ErdXml:
    def __init__(self) -> None:
        self.n = 2
        self.parts: list[str] = ['<mxCell id="0"/>', '<mxCell id="1" parent="0"/>']
        self.table_ids: dict[str, str] = {}

    def nid(self) -> str:
        i = str(self.n)
        self.n += 1
        return i

    def esc(self, t: str) -> str:
        return html.escape(t, quote=True)

    def table(self, name: str, x: float, y: float, w: float, rows: list[str]) -> str:
        tid = self.nid()
        self.table_ids[name] = tid
        rh = 24
        h = 30 + len(rows) * rh
        self.parts.append(
            f'<mxCell id="{tid}" value="{self.esc(name)}" '
            f'style="shape=table;startSize=30;container=1;collapsible=1;childLayout=tableLayout;'
            f'fixedRows=1;rowLines=0;fontStyle=1;align=center;resizeLast=1;html=1;'
            f'strokeColor=#666666;fillColor=#dae8fc;fontSize=12;fontFamily=Times New Roman;" '
            f'vertex="1" parent="1">'
            f'<mxGeometry x="{x}" y="{y}" width="{w}" height="{h}" as="geometry"/></mxCell>'
        )
        for i, row in enumerate(rows):
            rid = self.nid()
            self.parts.append(
                f'<mxCell id="{rid}" value="" style="shape=partialRectangle;collapsible=0;dropTarget=0;'
                f'pointerEvents=0;fillColor=none;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;'
                f'top=0;left=0;bottom=0;right=0;" vertex="1" parent="{tid}">'
                f'<mxGeometry y="{30 + i * rh}" width="{w}" height="{rh}" as="geometry"/></mxCell>'
            )
            bold = row.strip().startswith("PK ")
            style = (
                "shape=partialRectangle;overflow=hidden;connectable=0;fillColor=none;"
                "align=left;spacingLeft=6;spacingRight=4;html=1;whiteSpace=wrap;"
                f"fontStyle={'1' if bold else '0'};fontSize=11;fontFamily=Times New Roman;"
            )
            cid = self.nid()
            self.parts.append(
                f'<mxCell id="{cid}" value="{self.esc(row)}" style="{style}" vertex="1" parent="{rid}">'
                f'<mxGeometry width="{w}" height="{rh}" as="geometry"/></mxCell>'
            )
        return tid

    def rel(self, from_table: str, to_table: str, label: str = "", optional_child: bool = True) -> None:
        """1:N từ from (1) tới to (N). optional_child: phía N cho phép 0 (o<)."""
        eid = self.nid()
        start = "ERmandOne"
        end = "ERzeroToMany" if optional_child else "ERmany"
        val = f' value="{self.esc(label)}"' if label else ""
        self.parts.append(
            f'<mxCell id="{eid}" style="edgeStyle=entityRelationEdgeStyle;rounded=0;'
            f"html=1;startArrow={start};endArrow={end};startFill=0;endFill=0;"
            f'fontFamily=Times New Roman;fontSize=11;" edge="1" parent="1" '
            f'source="{self.table_ids[from_table]}" target="{self.table_ids[to_table]}"{val}>'
            f'<mxGeometry relative="1" as="geometry"/></mxCell>'
        )

    def rel_one_one(self, from_table: str, to_table: str, optional_to: bool = False) -> None:
        eid = self.nid()
        end = "ERzeroToOne" if optional_to else "ERmandOne"
        self.parts.append(
            f'<mxCell id="{eid}" style="edgeStyle=entityRelationEdgeStyle;rounded=0;'
            f"html=1;startArrow=ERmandOne;endArrow={end};startFill=0;endFill=0;"
            f'fontFamily=Times New Roman;fontSize=11;" edge="1" parent="1" '
            f'source="{self.table_ids[from_table]}" target="{self.table_ids[to_table]}">'
            f'<mxGeometry relative="1" as="geometry"/></mxCell>'
        )

    def legend(self, x: float, y: float) -> None:
        lines = [
            "Chú thích",
            "PK: Khóa chính",
            "FK: Khóa ngoại",
            "|| — đúng một bản ghi (1..1)",
            "o< — không hoặc nhiều (0..N)",
            "|< — một hoặc nhiều (1..N)",
        ]
        text = "&#xa;".join(self.esc(l) for l in lines)
        lid = self.nid()
        self.parts.append(
            f'<mxCell id="{lid}" value="{text}" style="rounded=0;whiteSpace=wrap;html=1;'
            f"align=left;verticalAlign=top;spacingLeft=8;spacingTop=6;"
            f'fillColor=#fff2cc;strokeColor=#d6b656;fontSize=11;fontFamily=Times New Roman;" '
            f'vertex="1" parent="1">'
            f'<mxGeometry x="{x}" y="{y}" width="220" height="130" as="geometry"/></mxCell>'
        )

    def title(self) -> None:
        tid = self.nid()
        self.parts.append(
            f'<mxCell id="{tid}" value="Hình 4.4 — Sơ đồ ERD lõi nghiệp vụ TalentHub (MySQL / Prisma)" '
            f'style="text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;'
            f'fontStyle=1;fontSize=13;fontFamily=Times New Roman;" vertex="1" parent="1">'
            f'<mxGeometry x="200" y="10" width="900" height="30" as="geometry"/></mxCell>'
        )

    def xml(self) -> str:
        body = "\n        ".join(self.parts)
        return f"""<mxfile host="app.diagrams.net" agent="TalentHub-ERD" version="22.1.0" type="device">
  <diagram name="ERD TalentHub" id="erd-talenthub">
    <mxGraphModel dx="1400" dy="900" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1654" pageHeight="1169" math="0" shadow="0">
      <root>
        {body}
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
"""


def main() -> None:
    e = ErdXml()
    e.title()

    e.table(
        "users",
        40,
        60,
        300,
        [
            "PK user_id BIGINT NOT NULL AUTO_INCREMENT",
            "email VARCHAR(255) NOT NULL UNIQUE",
            "password_hash VARCHAR(255) NOT NULL",
            "full_name VARCHAR(150) NOT NULL",
            "phone VARCHAR(20) NULL",
            "role ENUM NOT NULL",
            "status ENUM NOT NULL DEFAULT 'PENDING'",
            "email_verified_at DATETIME NULL",
            "created_at DATETIME NOT NULL",
            "updated_at DATETIME NOT NULL",
            "deleted_at DATETIME NULL",
        ],
    )

    e.table(
        "company_profiles",
        40,
        380,
        300,
        [
            "PK company_id BIGINT NOT NULL AUTO_INCREMENT",
            "FK user_id BIGINT NOT NULL UNIQUE",
            "company_name VARCHAR(255) NOT NULL",
            "tax_code VARCHAR(50) NULL",
            "industry VARCHAR(150) NULL",
            "logo_asset_id BIGINT NULL",
            "verification_status ENUM NOT NULL",
            "verified_by BIGINT NULL",
            "created_at DATETIME NOT NULL",
            "updated_at DATETIME NOT NULL",
        ],
    )

    e.table(
        "categories",
        400,
        60,
        280,
        [
            "PK category_id BIGINT NOT NULL AUTO_INCREMENT",
            "category_name VARCHAR(150) NOT NULL UNIQUE",
            "slug VARCHAR(180) NOT NULL UNIQUE",
            "parent_category_id BIGINT NULL",
            "status ENUM NOT NULL DEFAULT 'ACTIVE'",
            "created_at DATETIME NOT NULL",
            "updated_at DATETIME NOT NULL",
        ],
    )

    e.table(
        "jobs",
        400,
        280,
        320,
        [
            "PK job_id BIGINT NOT NULL AUTO_INCREMENT",
            "FK company_id BIGINT NOT NULL",
            "FK category_id BIGINT NOT NULL",
            "title VARCHAR(255) NOT NULL",
            "slug VARCHAR(300) NOT NULL UNIQUE",
            "description LONGTEXT NOT NULL",
            "requirements LONGTEXT NOT NULL",
            "location VARCHAR(255) NOT NULL",
            "salary_min DECIMAL(15,2) NULL",
            "salary_max DECIMAL(15,2) NULL",
            "employment_type ENUM NOT NULL DEFAULT 'FULL_TIME'",
            "job_type ENUM NOT NULL DEFAULT 'NORMAL'",
            "status ENUM NOT NULL DEFAULT 'DRAFT'",
            "published_at DATETIME NULL",
            "expires_at DATETIME NULL",
            "created_at DATETIME NOT NULL",
            "updated_at DATETIME NOT NULL",
            "deleted_at DATETIME NULL",
        ],
    )

    e.table(
        "applications",
        400,
        720,
        320,
        [
            "PK application_id BIGINT NOT NULL AUTO_INCREMENT",
            "FK job_id BIGINT NOT NULL",
            "FK student_user_id BIGINT NOT NULL",
            "FK cv_version_id BIGINT NOT NULL",
            "cover_letter TEXT NULL",
            "status ENUM NOT NULL DEFAULT 'SUBMITTED'",
            "applied_at DATETIME NOT NULL",
            "updated_at DATETIME NOT NULL",
            "UNIQUE (job_id, student_user_id)",
        ],
    )

    e.table(
        "cvs",
        780,
        60,
        300,
        [
            "PK cv_id BIGINT NOT NULL AUTO_INCREMENT",
            "FK student_user_id BIGINT NOT NULL",
            "template_id BIGINT NULL",
            "cv_name VARCHAR(200) NOT NULL",
            "current_version_id BIGINT NULL UNIQUE",
            "visibility ENUM NOT NULL DEFAULT 'PRIVATE'",
            "created_at DATETIME NOT NULL",
            "updated_at DATETIME NOT NULL",
            "deleted_at DATETIME NULL",
        ],
    )

    e.table(
        "cv_versions",
        780,
        340,
        320,
        [
            "PK cv_version_id BIGINT NOT NULL AUTO_INCREMENT",
            "FK cv_id BIGINT NOT NULL",
            "FK file_asset_id BIGINT NULL",
            "FK created_by BIGINT NOT NULL",
            "version_number INT NOT NULL",
            "source_type ENUM NOT NULL",
            "content_json JSON NULL",
            "plain_text_content LONGTEXT NULL",
            "created_at DATETIME NOT NULL",
            "UNIQUE (cv_id, version_number)",
        ],
    )

    e.table(
        "media_assets",
        780,
        640,
        320,
        [
            "PK asset_id BIGINT NOT NULL AUTO_INCREMENT",
            "FK owner_user_id BIGINT NOT NULL",
            "asset_type ENUM NOT NULL",
            "public_id VARCHAR(255) NOT NULL UNIQUE",
            "secure_url VARCHAR(1000) NOT NULL",
            "mime_type VARCHAR(100) NULL",
            "file_size BIGINT NULL",
            "status ENUM NOT NULL DEFAULT 'ACTIVE'",
            "created_at DATETIME NOT NULL",
            "deleted_at DATETIME NULL",
        ],
    )

    e.table(
        "job_status_history",
        1120,
        280,
        300,
        [
            "PK history_id BIGINT NOT NULL AUTO_INCREMENT",
            "FK job_id BIGINT NOT NULL",
            "FK changed_by BIGINT NOT NULL",
            "old_status VARCHAR(30) NULL",
            "new_status VARCHAR(30) NOT NULL",
            "reason TEXT NULL",
            "created_at DATETIME NOT NULL",
        ],
    )

    # Quan hệ (theo schema.prisma)
    e.rel_one_one("users", "company_profiles", optional_to=True)
    e.rel("users", "cvs")  # student owns CVs
    e.rel("users", "applications")  # student_user_id
    e.rel("company_profiles", "jobs")
    e.rel("categories", "jobs")
    e.rel("jobs", "applications")
    e.rel("jobs", "job_status_history")
    e.rel("cvs", "cv_versions")
    e.rel("cv_versions", "applications")
    e.rel("media_assets", "cv_versions")  # file_asset optional N:1 from cv_version side
    e.rel("users", "media_assets")  # owner

    e.legend(1120, 720)

    OUT.write_text(e.xml(), encoding="utf-8")
    print(f"Đã ghi: {OUT}")


if __name__ == "__main__":
    main()
