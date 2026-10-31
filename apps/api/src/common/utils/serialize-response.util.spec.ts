import { Prisma } from '@prisma/client';
import { serializeForJson } from './serialize-response.util';

describe('serializeForJson', () => {
  it('serializes Prisma Decimal as plain numeric string', () => {
    const job = {
      salaryMin: new Prisma.Decimal('15000000'),
      salaryMax: new Prisma.Decimal('25000000'),
    };
    expect(serializeForJson(job)).toEqual({
      salaryMin: '15000000',
      salaryMax: '25000000',
    });
  });

  it('serializes bigint fields', () => {
    expect(serializeForJson({ jobId: 42n })).toEqual({ jobId: '42' });
  });
});
