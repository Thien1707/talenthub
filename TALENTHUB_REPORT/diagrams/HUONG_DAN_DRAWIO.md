# Sơ đồ Draw.io (diagrams.net) — TalentHub

**Chỉ dùng file `.drawio`** trong thư mục này (không còn Mermaid).

## Danh sách file

| File | Mô tả |
|------|--------|
| `use_case_overall.drawio` | Use case tổng quát |
| `use_case_candidate.drawio` | Use case ứng viên |
| `use_case_employer.drawio` | Use case NTD |
| `use_case_admin.drawio` | Use case STAFF / Admin |
| **`erd.drawio`** | **ERD bảng cột PK/FK + chân quạ** (mẫu báo cáo) |
| `system_architecture.drawio` | Kiến trúc triển khai |
| `activity_job_application.drawio` | Activity — ứng tuyển |
| `activity_job_posting.drawio` | Activity — đăng tin |
| `sequence_*.drawio` | Sequence diagram |

## Tạo lại sơ đồ

```powershell
# Use case, activity, sequence, kiến trúc
python TALENTHUB_REPORT\scripts\generate_drawio.py

# ERD (bảng + cột — không ghi đè bởi generate_drawio.py)
python TALENTHUB_REPORT\scripts\generate_erd_drawio.py
```

## Mở / chỉnh

1. [draw.io Desktop](https://github.com/jgraph/drawio-desktop/releases) hoặc https://app.diagrams.net/
2. **File → Open** → chọn `.drawio`
3. ERD: kéo lại đường quan hệ nếu cần; giữ **entityRelationEdgeStyle** (chân quạ)

## Xuất PNG (`diagram_exports`)

**File → Export as → PNG** (zoom 200%, nền trắng) → lưu `TALENTHUB_REPORT\diagram_exports\erd.png` (v.v.)

CLI (nếu đã cài draw.io Desktop):

```powershell
& "$env:LocalAppData\Programs\draw.io\draw.io.exe" -x -f png -s 2 -b 10 `
  -o "D:\TalentHub\TALENTHUB_REPORT\diagram_exports\erd.png" `
  "D:\TalentHub\TALENTHUB_REPORT\diagrams\erd.drawio"
```

Sau đó: `python TALENTHUB_REPORT\scripts\generate_report.py` để cập nhật Word.
