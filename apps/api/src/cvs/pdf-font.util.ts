import * as fs from 'fs';
import * as path from 'path';

const CANDIDATE_FONTS = [
  path.join(process.cwd(), 'assets', 'fonts', 'NotoSans-Regular.ttf'),
  path.join(process.cwd(), 'assets', 'fonts', 'DejaVuSans.ttf'),
  'C:\\Windows\\Fonts\\arial.ttf',
  'C:\\Windows\\Fonts\\tahoma.ttf',
  '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
  '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf',
];

/** TTF hỗ trợ tiếng Việt cho PDFKit; undefined → font mặc định (chỉ Latin). */
export function resolvePdfUnicodeFontPath(): string | undefined {
  for (const p of CANDIDATE_FONTS) {
    try {
      if (fs.existsSync(p)) return p;
    } catch {
      /* ignore */
    }
  }
  return undefined;
}
