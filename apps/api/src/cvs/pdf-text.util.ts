// pdf-parse v1 default export (CommonJS)
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse') as (
  buffer: Buffer,
) => Promise<{ text: string; numpages: number }>;

const MAX_CHARS = 120_000;

export async function extractPlainTextFromPdf(buffer: Buffer): Promise<string> {
  const result = await pdfParse(buffer);
  const text = (result.text ?? '').replace(/\s+/g, ' ').trim();
  if (!text) {
    return '[PDF không trích được văn bản — có thể là scan/ảnh]';
  }
  return text.length > MAX_CHARS ? `${text.slice(0, MAX_CHARS)}…` : text;
}
