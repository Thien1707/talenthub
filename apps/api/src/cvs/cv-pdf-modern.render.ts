import PDFDocument from 'pdfkit';
import type { CvContent } from './cv-content.schema';

type PdfDoc = InstanceType<typeof PDFDocument>;

const SIDEBAR = '#1e3a5f';
const SIDEBAR_W = 155;
const MAIN_X = SIDEBAR_W + 28;
const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN_BOTTOM = 50;

export function renderModernCvPdf(
  doc: PdfDoc,
  cvName: string,
  content: CvContent,
  fontPath?: string,
) {
  const useFont = (size: number) => {
    if (fontPath) doc.font(fontPath);
    doc.fontSize(size);
  };

  const drawSidebar = () => {
    doc.save();
    doc.rect(0, 0, SIDEBAR_W, PAGE_H).fill(SIDEBAR);
    doc.restore();
  };

  drawSidebar();

  let sy = 48;
  const name = content.personal.fullName?.trim() || cvName;
  doc.fillColor('#ffffff');
  useFont(14);
  doc.text(name.toUpperCase(), 16, sy, { width: SIDEBAR_W - 32, align: 'center' });
  sy += doc.heightOfString(name, { width: SIDEBAR_W - 32 }) + 6;
  useFont(9);
  doc.fillColor('#bae6fd');
  const headline = content.personal.headline?.trim() || 'Sinh viên / Ứng viên';
  doc.text(headline, 16, sy, { width: SIDEBAR_W - 32, align: 'center' });
  sy += 28;

  doc.fillColor('#7dd3fc');
  useFont(8);
  doc.text('LIÊN HỆ', 18, sy);
  sy += 14;
  doc.fillColor('#ffffff');
  useFont(9);
  for (const line of [
    content.personal.email,
    content.personal.phone,
    content.personal.city,
  ].filter(Boolean)) {
    doc.text(String(line), 18, sy, { width: SIDEBAR_W - 36 });
    sy += 14;
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
  const sectionTitle = (title: string) => {
    useFont(10);
    doc.fillColor('#1e3a5f');
    doc.text(title.toUpperCase(), MAIN_X, my, { width: PAGE_W - MAIN_X - 40 });
    my += 14;
    doc
      .moveTo(MAIN_X, my)
      .lineTo(PAGE_W - 40, my)
      .strokeColor('#1e3a5f')
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
    my += doc.heightOfString(content.personal.summary, {
      width: PAGE_W - MAIN_X - 40,
    }) + 16;
  }

  if (content.experience.length) {
    sectionTitle('Kinh nghiệm');
    for (const ex of content.experience) {
      useFont(10);
      doc.fillColor('#0f172a');
      const line1 = [ex.title, ex.company].filter(Boolean).join(' · ');
      doc.text(line1 || 'Kinh nghiệm', MAIN_X, my, { width: PAGE_W - MAIN_X - 40 });
      my += 12;
      if (ex.from || ex.to) {
        useFont(8);
        doc.fillColor('#64748b');
        doc.text([ex.from, ex.to].filter(Boolean).join(' – '), MAIN_X, my);
        my += 12;
      }
      if (ex.description) {
        useFont(9);
        doc.fillColor('#475569');
        doc.text(ex.description, MAIN_X, my, { width: PAGE_W - MAIN_X - 40 });
        my +=
          doc.heightOfString(ex.description, { width: PAGE_W - MAIN_X - 40 }) +
          10;
      }
      my += 6;
      if (my > PAGE_H - MARGIN_BOTTOM) {
        doc.addPage();
        drawSidebar();
        my = 48;
        doc.fillColor('#334155');
      }
    }
    my += 8;
  }

  if (content.education.length) {
    sectionTitle('Học vấn');
    for (const ed of content.education) {
      useFont(10);
      doc.fillColor('#0f172a');
      doc.text(ed.school || 'Trường', MAIN_X, my);
      my += 12;
      if (ed.major) {
        useFont(9);
        doc.fillColor('#475569');
        doc.text(ed.major, MAIN_X, my);
        my += 12;
      }
      my += 4;
    }
  }

  if (content.projects.length) {
    my += 8;
    sectionTitle('Dự án');
    for (const p of content.projects) {
      useFont(10);
      doc.fillColor('#0f172a');
      doc.text(p.name || 'Dự án', MAIN_X, my);
      my += 12;
      if (p.description) {
        useFont(9);
        doc.fillColor('#475569');
        doc.text(p.description, MAIN_X, my, { width: PAGE_W - MAIN_X - 40 });
        my +=
          doc.heightOfString(p.description, { width: PAGE_W - MAIN_X - 40 }) +
          8;
      }
    }
  }
}

export function createModernPdfDocument() {
  return new PDFDocument({
    size: 'A4',
    margin: 0,
    autoFirstPage: true,
  });
}
