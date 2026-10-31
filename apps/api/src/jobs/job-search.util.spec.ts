import {
  buildPublicJobKeywordWhere,
  foldSearchAscii,
  tokenizeJobKeyword,
} from './job-search.util';

describe('job-search.util', () => {
  it('foldSearchAscii bỏ dấu tiếng Việt', () => {
    expect(foldSearchAscii('Kế toán')).toBe('Ke toan');
    expect(foldSearchAscii('Marketing')).toBe('Marketing');
  });

  it('tokenizeJobKeyword tách từ', () => {
    expect(tokenizeJobKeyword('  Frontend   Developer ')).toEqual([
      'Frontend',
      'Developer',
    ]);
  });

  it('buildPublicJobKeywordWhere trả null khi rỗng', () => {
    expect(buildPublicJobKeywordWhere('')).toBeNull();
    expect(buildPublicJobKeywordWhere(undefined)).toBeNull();
  });

  it('buildPublicJobKeywordWhere AND nhiều token', () => {
    const where = buildPublicJobKeywordWhere('Frontend Developer');
    expect(where).toHaveProperty('AND');
    expect(Array.isArray((where as { AND: unknown[] }).AND)).toBe(true);
    expect((where as { AND: unknown[] }).AND).toHaveLength(2);
  });
});
