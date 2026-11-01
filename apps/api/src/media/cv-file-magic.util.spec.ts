import {
  assertValidCvUploadBuffer,
  detectCvUploadKind,
} from './cv-file-magic.util';

describe('cv-file-magic', () => {
  it('nhận PDF', () => {
    const buf = Buffer.from('%PDF-1.4\n');
    expect(detectCvUploadKind(buf)).toBe('pdf');
    expect(assertValidCvUploadBuffer(buf).mimeType).toBe('application/pdf');
  });

  it('từ chối file lạ', () => {
    expect(() => assertValidCvUploadBuffer(Buffer.from('hello'))).toThrow();
  });
});
