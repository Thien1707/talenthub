import { BadRequestException } from '@nestjs/common';

export type CvUploadKind = 'pdf' | 'doc' | 'docx';

const PDF_MIME = 'application/pdf';
const DOC_MIME = 'application/msword';
const DOCX_MIME =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

export function detectCvUploadKind(buffer: Buffer): CvUploadKind | null {
  if (buffer.length >= 5 && buffer.subarray(0, 5).toString('ascii') === '%PDF-') {
    return 'pdf';
  }
  if (
    buffer.length >= 8 &&
    buffer[0] === 0xd0 &&
    buffer[1] === 0xcf &&
    buffer[2] === 0x11 &&
    buffer[3] === 0xe0
  ) {
    return 'doc';
  }
  if (buffer.length >= 4 && buffer[0] === 0x50 && buffer[1] === 0x4b) {
    const head = buffer.subarray(0, Math.min(buffer.length, 4096)).toString('utf8');
    if (
      head.includes('word/') ||
      head.includes('WordDocument') ||
      head.includes('word/document.xml')
    ) {
      return 'docx';
    }
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
