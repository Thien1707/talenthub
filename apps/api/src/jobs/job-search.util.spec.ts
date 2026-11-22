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

  it('tokenizeJobKeyword bỏ dấu câu và ký tự đặc biệt', () => {
    expect(tokenizeJobKeyword('Frontend, Developer!')).toEqual([
      'Frontend',
      'Developer',
    ]);
    expect(tokenizeJobKeyword('Full-stack Developer')).toEqual([
      'Full',
      'stack',
      'Developer',
    ]);
    expect(tokenizeJobKeyword('!!!')).toEqual([]);
  });

  it('buildPublicJobKeywordWhere trả null khi rỗng', () => {
    expect(buildPublicJobKeywordWhere('')).toBeNull();
    expect(buildPublicJobKeywordWhere(undefined)).toBeNull();
    expect(buildPublicJobKeywordWhere('!!!')).toBeNull();
  });

  it('buildPublicJobKeywordWhere AND nhiều token', () => {
    const where = buildPublicJobKeywordWhere('Frontend Developer');
    expect(where).toHaveProperty('AND');
    expect(Array.isArray((where as { AND: unknown[] }).AND)).toBe(true);
    expect((where as { AND: unknown[] }).AND).toHaveLength(2);
  });
});
