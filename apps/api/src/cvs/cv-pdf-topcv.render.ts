import PDFDocument from 'pdfkit';
import type { CvContent } from './cv-content.schema';

type PdfDoc = InstanceType<typeof PDFDocument>;

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 44;
const CONTENT_W = PAGE_W - MARGIN * 2;
const ACCENT = '#00b14f';

function bulletLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.replace(/^[\s•\-–]+/, '').trim())
    .filter(Boolean);
}

export function createTopCvPdfDocument() {
  return new PDFDocument({
    size: 'A4',
    margin: MARGIN,
    autoFirstPage: true,
  });
}

export function renderTopCvPdf(
  doc: PdfDoc,
  cvName: string,
  content: CvContent,
  fontPath?: string,
) {
  const useFont = (size: number, bold = false) => {
    if (fontPath) doc.font(fontPath);
    doc.fontSize(size);
    if (bold && !fontPath) doc.font('Helvetica-Bold');
    else if (!fontPath) doc.font('Helvetica');
  };

  let y = MARGIN;

  const ensureSpace = (need: number) => {
    if (y + need > PAGE_H - MARGIN) {
      doc.addPage();
      y = MARGIN;
    }
  };

  const name = content.personal.fullName?.trim() || cvName;
  useFont(20, true);
  doc.fillColor('#1a1a1a');
  doc.text(name, MARGIN, y, { width: CONTENT_W });
  y += doc.heightOfString(name, { width: CONTENT_W }) + 4;

  const headline = content.personal.headline?.trim();
  if (headline) {
    useFont(11, false);
    doc.fillColor('#444444');
    doc.text(headline, MARGIN, y, { width: CONTENT_W });
    y += 16;
  }

  const contact = [
    content.personal.phone,
    content.personal.email,
    content.personal.website,
    content.personal.city,
  ].filter(Boolean);
  if (contact.length) {
    useFont(9, false);
    doc.fillColor('#555555');
    doc.text(contact.join('   ·   '), MARGIN, y, { width: CONTENT_W });
    y += 18;
  }

  y += 4;

  const section = (title: string) => {
    ensureSpace(36);
    y += 10;
    useFont(10, true);
    doc.fillColor('#1a1a1a');
    doc.text(title.toUpperCase(), MARGIN, y, { width: CONTENT_W });
    y += 14;
    doc
      .moveTo(MARGIN, y)
      .lineTo(MARGIN + CONTENT_W, y)
      .strokeColor(ACCENT)
      .lineWidth(2)
      .stroke();
    y += 10;
    doc.fillColor('#333333');
  };

  const bodyText = (text: string, size = 9) => {
    useFont(size, false);
    doc.text(text, MARGIN, y, { width: CONTENT_W, align: 'justify' });
    y +=
      doc.heightOfString(text, { width: CONTENT_W, align: 'justify' }) + 8;
  };

  const rowHeader = (left: string, right?: string) => {
    ensureSpace(28);
    useFont(10, true);
    doc.fillColor('#1a1a1a');
    const rightW = right ? 110 : 0;
    doc.text(left, MARGIN, y, { width: CONTENT_W - rightW - 8 });
    if (right) {
      useFont(9, false);
      doc.fillColor('#666666');
      doc.text(right, MARGIN + CONTENT_W - rightW, y, {
        width: rightW,
        align: 'right',
      });
    }
    y += 14;
  };

  if (content.personal.summary?.trim()) {
    section('Mục tiêu nghề nghiệp');
    bodyText(content.personal.summary.trim());
  }

  if (content.education.length) {
    section('Học vấn');
    for (const ed of content.education) {
      rowHeader(
        ed.school || 'Trường / cơ sở đào tạo',
        [ed.from, ed.to].filter(Boolean).join(' - '),
      );
      if (ed.major) {
        useFont(9, true);
        doc.fillColor('#333333');
        doc.text(ed.major, MARGIN, y, { width: CONTENT_W });
        y += 12;
      }
      if (ed.description) {
        useFont(9, false);
        doc.fillColor('#555555');
        doc.text(ed.description, MARGIN, y, { width: CONTENT_W });
        y += doc.heightOfString(ed.description, { width: CONTENT_W }) + 6;
      }
      y += 4;
    }
  }

  if (content.experience.length) {
    section('Kinh nghiệm làm việc');
    for (const ex of content.experience) {
      rowHeader(
        ex.company || 'Công ty',
        [ex.from, ex.to].filter(Boolean).join(' - '),
      );
      if (ex.title) {
        useFont(9, true);
        doc.fillColor('#333333');
        doc.text(ex.title, MARGIN, y, { width: CONTENT_W });
        y += 12;
      }
      if (ex.description) {
        for (const line of bulletLines(ex.description)) {
          ensureSpace(20);
          useFont(9, false);
          doc.fillColor('#444444');
          const bullet = `• ${line}`;
          doc.text(bullet, MARGIN + 4, y, { width: CONTENT_W - 8 });
          y += doc.heightOfString(bullet, { width: CONTENT_W - 8 }) + 2;
        }
      }
      y += 6;
    }
  }

  if (content.skills.length) {
    section('Kỹ năng');
    const mid = Math.ceil(content.skills.length / 2);
    const col1 = content.skills.slice(0, mid);
    const col2 = content.skills.slice(mid);
    const colW = CONTENT_W / 2 - 8;
    let sy = y;
    useFont(9, false);
    doc.fillColor('#333333');
    for (let i = 0; i < col1.length; i++) {
      ensureSpace(14);
      doc.text(col1[i], MARGIN, sy, { width: colW });
      sy += 14;
    }
    let sy2 = y;
    for (let i = 0; i < col2.length; i++) {
      doc.text(col2[i], MARGIN + colW + 16, sy2, { width: colW });
      sy2 += 14;
    }
    y = Math.max(sy, sy2) + 4;
  }

  const activities = content.activities ?? [];
  if (activities.length) {
    section('Hoạt động');
    for (const act of activities) {
      rowHeader(
        act.organization || 'Tổ chức',
        [act.from, act.to].filter(Boolean).join(' - '),
      );
      if (act.role) {
        useFont(9, true);
        doc.text(act.role, MARGIN, y, { width: CONTENT_W });
        y += 12;
      }
      if (act.description) {
        for (const line of bulletLines(act.description)) {
          ensureSpace(18);
          useFont(9, false);
          doc.text(`• ${line}`, MARGIN + 4, y, { width: CONTENT_W - 8 });
          y +=
            doc.heightOfString(`• ${line}`, { width: CONTENT_W - 8 }) + 2;
        }
      }
      y += 4;
    }
  }

  const certificates = content.certificates ?? [];
  if (certificates.length) {
    section('Chứng chỉ');
    for (const c of certificates) {
      rowHeader(c.name || 'Chứng chỉ', c.year);
      y += 2;
    }
  }

  const awards = content.awards ?? [];
  if (awards.length) {
    section('Danh hiệu và giải thưởng');
    for (const a of awards) {
      rowHeader(a.name || 'Danh hiệu', a.year);
      y += 2;
    }
  }

  if (content.personal.references?.trim()) {
    section('Người giới thiệu');
    bodyText(content.personal.references.trim());
  }

  if (content.personal.interests?.trim()) {
    section('Sở thích');
    bodyText(content.personal.interests.trim());
  }

  if (content.personal.extraNotes?.trim()) {
    section('Thông tin thêm');
    bodyText(content.personal.extraNotes.trim());
  }

  if (content.projects.length) {
    section('Dự án');
    for (const p of content.projects) {
      rowHeader(p.name || 'Dự án');
      if (p.description) bodyText(p.description, 9);
      if (p.link) {
        useFont(8, false);
        doc.fillColor(ACCENT);
        doc.text(p.link, MARGIN, y, { width: CONTENT_W });
        y += 12;
      }
    }
  }
}
