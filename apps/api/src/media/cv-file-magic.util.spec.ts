import {
  assertValidCvUploadBuffer,
  detectCvUploadKind,
} from './cv-file-magic.util';

describe('cv-file-magic', () => {
  it('nhận PDF ở byte 0', () => {
    const buf = Buffer.from('%PDF-1.4\n');
    expect(detectCvUploadKind(buf)).toBe('pdf');
  });

  it('nhận PDF có padding trước header (TopCV / ISO 32000)', () => {
    const padding = Buffer.alloc(128, 0);
    const buf = Buffer.concat([padding, Buffer.from('%PDF-1.7\n')]);
    expect(detectCvUploadKind(buf)).toBe('pdf');
    expect(assertValidCvUploadBuffer(buf).mimeType).toBe('application/pdf');
  });

  it('từ chối file lạ', () => {
    expect(() => assertValidCvUploadBuffer(Buffer.from('hello'))).toThrow();
  });
});
