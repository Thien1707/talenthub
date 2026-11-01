import PDFDocument from 'pdfkit';
import type { CvContent } from './cv-content.schema';
import { resolveSectionOrder, type CvSectionKey } from './cv-section-order.util';

type PdfDoc = InstanceType<typeof PDFDocument>;

const DEFAULT_SIDEBAR = '#1e3a5f';
const SIDEBAR_W = 155;
const MAIN_X = SIDEBAR_W + 28;
const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN_BOTTOM = 50;

function contactLines(content: CvContent) {
  return [content.personal.email, content.personal.phone, content.personal.city]
    .map((v) => (v ?? '').trim())
    .filter(Boolean);
}

export function renderModernCvPdf(
  doc: PdfDoc,
  cvName: string,
  content: CvContent,
  fontPath?: string,
  photoBuffer?: Buffer | null,
) {
  const sidebarColor =
    content.design?.accentColor?.trim() || DEFAULT_SIDEBAR;

  const useFont = (size: number) => {
    if (fontPath) doc.font(fontPath);
    doc.fontSize(size);
  };

  const drawSidebar = () => {
    doc.save();
    doc.rect(0, 0, SIDEBAR_W, PAGE_H).fill(sidebarColor);
    doc.restore();
  };

  drawSidebar();

  let sy = 36;
  const photoCenterX = SIDEBAR_W / 2;
  if (photoBuffer?.length) {
    try {
      doc.save();
      doc.circle(photoCenterX, sy + 28, 26).clip();
      doc.image(photoBuffer, photoCenterX - 26, sy + 2, {
        width: 52,
        height: 52,
      });
      doc.restore();
      sy += 72;
    } catch {
      sy = 48;
    }
  } else {
    sy = 48;
  }

  const name = content.personal.fullName?.trim() || cvName;
  doc.fillColor('#ffffff');
  useFont(14);
  doc.text(name.toUpperCase(), 16, sy, {
    width: SIDEBAR_W - 32,
    align: 'center',
  });
  sy += doc.heightOfString(name, { width: SIDEBAR_W - 32 }) + 6;
  useFont(9);
  doc.fillColor('#bae6fd');
  const headline =
    content.personal.headline?.trim() || 'Sinh viên / Ứng viên';
  doc.text(headline, 16, sy, { width: SIDEBAR_W - 32, align: 'center' });
  sy += 28;

  const lines = contactLines(content);
  if (lines.length) {
    doc.fillColor('#7dd3fc');
    useFont(8);
    doc.text('LIÊN HỆ', 18, sy);
    sy += 14;
    doc.fillColor('#ffffff');
    useFont(9);
    for (const line of lines) {
      doc.text(line, 18, sy, { width: SIDEBAR_W - 36 });
      sy += 14;
    }
  }

  if (content.skills.length) {
    sy += 10;
    doc.fillColor('#7dd3fc');
    useFont(8);
    doc.text('KỸ NĂNG', 18, sy);
    sy += 14;
    doc.fillColor('#ffffff');
    useFont(8);
    doc.text(content.skills.join(' · '), 18, sy, { width: SIDEBAR_W - 36 });
  }

  doc.fillColor('#0f172a');
  let my = 48;

  const ensureSpace = (needed = 40) => {
    if (my > PAGE_H - MARGIN_BOTTOM - needed) {
      doc.addPage();
      drawSidebar();
      my = 48;
      doc.fillColor('#334155');
    }
  };

  const sectionTitle = (title: string) => {
    ensureSpace(60);
    useFont(10);
    doc.fillColor(sidebarColor);
    doc.text(title.toUpperCase(), MAIN_X, my, { width: PAGE_W - MAIN_X - 40 });
    my += 14;
    doc
      .moveTo(MAIN_X, my)
      .lineTo(PAGE_W - 40, my)
      .strokeColor(sidebarColor)
      .lineWidth(1.5)
      .stroke();
    my += 12;
    doc.fillColor('#334155');
  };

  if (content.personal.summary?.trim()) {
    sectionTitle('Giới thiệu');
    useFont(10);
    doc.text(content.personal.summary.trim(), MAIN_X, my, {
      width: PAGE_W - MAIN_X - 40,
      align: 'left',
    });
    my +=
      doc.heightOfString(content.personal.summary, {
        width: PAGE_W - MAIN_X - 40,
      }) + 16;
  }

  const renderSection = (key: CvSectionKey) => {
    switch (key) {
      case 'skills':
        return;
      case 'experience':
        if (!content.experience.length) return;
        sectionTitle('Kinh nghiệm');
        for (const ex of content.experience) {
          ensureSpace(50);
          useFont(10);
          doc.fillColor('#0f172a');
          const line1 = [ex.title, ex.company].filter(Boolean).join(' · ');
          doc.text(line1 || 'Kinh nghiệm', MAIN_X, my, {
            width: PAGE_W - MAIN_X - 40,
          });
          my += 12;
          if (ex.from || ex.to) {
            useFont(8);
            doc.fillColor('#64748b');
            doc.text([ex.from, ex.to].filter(Boolean).join(' – '), MAIN_X, my);
            my += 12;
          }
          if (ex.description?.trim()) {
            useFont(9);
            doc.fillColor('#475569');
            doc.text(ex.description.trim(), MAIN_X, my, {
              width: PAGE_W - MAIN_X - 40,
            });
            my +=
              doc.heightOfString(ex.description, {
                width: PAGE_W - MAIN_X - 40,
              }) + 10;
          }
          my += 6;
        }
        my += 8;
        return;
      case 'education':
        if (!content.education.length) return;
        sectionTitle('Học vấn');
        for (const ed of content.education) {
          ensureSpace(40);
          useFont(10);
          doc.fillColor('#0f172a');
          doc.text(ed.school || 'Trường', MAIN_X, my);
          my += 12;
          if (ed.major?.trim()) {
            useFont(9);
            doc.fillColor('#475569');
            doc.text(ed.major.trim(), MAIN_X, my);
            my += 12;
          }
          my += 4;
        }
        return;
      case 'projects':
        if (!content.projects.length) return;
        sectionTitle('Dự án');
        for (const p of content.projects) {
          ensureSpace(40);
          useFont(10);
          doc.fillColor('#0f172a');
          doc.text(p.name || 'Dự án', MAIN_X, my);
          my += 12;
          if (p.description?.trim()) {
            useFont(9);
            doc.fillColor('#475569');
            doc.text(p.description.trim(), MAIN_X, my, {
              width: PAGE_W - MAIN_X - 40,
            });
            my +=
              doc.heightOfString(p.description, {
                width: PAGE_W - MAIN_X - 40,
              }) + 6;
          }
          if (p.link?.trim()) {
            useFont(8);
            doc.fillColor('#0369a1');
            doc.text(p.link.trim(), MAIN_X, my, {
              width: PAGE_W - MAIN_X - 40,
            });
            my += 12;
          }
        }
        return;
      case 'activities': {
        const activities = content.activities ?? [];
        if (!activities.length) return;
        sectionTitle('Hoạt động');
        for (const act of activities) {
          ensureSpace(40);
          useFont(10);
          doc.fillColor('#0f172a');
          const head = [act.organization, act.role].filter(Boolean).join(' · ');
          doc.text(head || 'Hoạt động', MAIN_X, my, {
            width: PAGE_W - MAIN_X - 40,
          });
          my += 12;
          if (act.from || act.to) {
            useFont(8);
            doc.fillColor('#64748b');
            doc.text([act.from, act.to].filter(Boolean).join(' – '), MAIN_X, my);
            my += 12;
          }
          if (act.description?.trim()) {
            useFont(9);
            doc.fillColor('#475569');
            doc.text(act.description.trim(), MAIN_X, my, {
              width: PAGE_W - MAIN_X - 40,
            });
            my +=
              doc.heightOfString(act.description, {
                width: PAGE_W - MAIN_X - 40,
              }) + 8;
          }
        }
        return;
      }
      case 'certificates': {
        const certificates = content.certificates ?? [];
        const awards = content.awards ?? [];
        if (!certificates.length && !awards.length) return;
        sectionTitle('Chứng chỉ & giải thưởng');
        for (const c of certificates) {
          ensureSpace(24);
          useFont(9);
          doc.fillColor('#334155');
          const t = [c.name || 'Chứng chỉ', c.year ? `(${c.year})` : '']
            .filter(Boolean)
            .join(' ');
          doc.text(t, MAIN_X, my);
          my += 12;
        }
        for (const a of awards) {
          ensureSpace(24);
          useFont(9);
          doc.fillColor('#334155');
          const t = [a.name || 'Danh hiệu', a.year ? `(${a.year})` : '']
            .filter(Boolean)
            .join(' ');
          doc.text(t, MAIN_X, my);
          my += 12;
        }
        return;
      }
      default:
        return;
    }
  };

  for (const key of resolveSectionOrder(content)) {
    renderSection(key);
  }
}

export function createModernPdfDocument() {
  return new PDFDocument({
    size: 'A4',
    margin: 0,
    autoFirstPage: true,
  });
}
