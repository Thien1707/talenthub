import { BadRequestException } from '@nestjs/common';

export type CvUploadKind = 'pdf' | 'doc' | 'docx';

/** ISO 32000: reader tìm header %PDF- trong ~1024 byte đầu (nhiều exporter thêm padding). */
const PDF_HEADER_SCAN = 4096;

const PDF_MIME = 'application/pdf';
const DOC_MIME = 'application/msword';
const DOCX_MIME =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

function bufferIncludesPdfHeader(buffer: Buffer): boolean {
  const scan = Math.min(buffer.length, PDF_HEADER_SCAN);
  for (let i = 0; i <= scan - 5; i++) {
    if (
      buffer[i] === 0x25 &&
      buffer[i + 1] === 0x50 &&
      buffer[i + 2] === 0x44 &&
      buffer[i + 3] === 0x46 &&
      buffer[i + 4] === 0x2d
    ) {
      return true;
    }
  }
  return false;
}

function isOleDoc(buffer: Buffer): boolean {
  return (
    buffer.length >= 8 &&
    buffer[0] === 0xd0 &&
    buffer[1] === 0xcf &&
    buffer[2] === 0x11 &&
    buffer[3] === 0xe0
  );
}

function isDocxZip(buffer: Buffer): boolean {
  if (buffer.length < 4 || buffer[0] !== 0x50 || buffer[1] !== 0x4b) {
    return false;
  }
  const head = buffer.subarray(0, Math.min(buffer.length, 8192)).toString('utf8');
  return (
    head.includes('word/') ||
    head.includes('WordDocument') ||
    head.includes('word/document.xml') ||
    head.includes('[Content_Types].xml')
  );
}

export function detectCvUploadKind(buffer: Buffer): CvUploadKind | null {
  if (!buffer?.length) return null;

  if (bufferIncludesPdfHeader(buffer)) {
    return 'pdf';
  }
  if (isOleDoc(buffer)) {
    return 'doc';
  }
  if (isDocxZip(buffer)) {
    return 'docx';
  }
  return null;
}

export function mimeForCvUploadKind(kind: CvUploadKind): string {
  switch (kind) {
    case 'pdf':
      return PDF_MIME;
    case 'doc':
      return DOC_MIME;
    case 'docx':
      return DOCX_MIME;
  }
}

/** Kiểm tra nội dung thật; trả MIME chuẩn để lưu Cloudinary. */
export function assertValidCvUploadBuffer(buffer: Buffer): {
  kind: CvUploadKind;
  mimeType: string;
} {
  const kind = detectCvUploadKind(buffer);
  if (!kind) {
    throw new BadRequestException(
      'File không hợp lệ — chỉ chấp nhận PDF, DOC hoặc DOCX',
    );
  }
  return { kind, mimeType: mimeForCvUploadKind(kind) };
}
