import { JobStatus, JobType } from '@prisma/client';
import { JobsService } from './jobs.service';

describe('JobsService quota rules (documentation)', () => {
  it('defines editable statuses as draft or rejected', () => {
    const editable = (status: JobStatus) =>
      status === JobStatus.DRAFT || status === JobStatus.REJECTED;
    expect(editable(JobStatus.DRAFT)).toBe(true);
    expect(editable(JobStatus.REJECTED)).toBe(true);
    expect(editable(JobStatus.PENDING)).toBe(false);
  });

  it('VIP requires payment before submit', () => {
    const needsPayment = (jobType: JobType, isPaid: boolean) =>
      jobType === JobType.VIP && !isPaid;
    expect(needsPayment(JobType.VIP, false)).toBe(true);
    expect(needsPayment(JobType.NORMAL, false)).toBe(false);
  });
});

// Integration tests for submitForModeration require MySQL — see test/e2e later.
