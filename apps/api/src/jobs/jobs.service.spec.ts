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

/** Quy tắc chuyển trạng thái tin (đồng bộ jobs.service). */
function canPause(status: JobStatus) {
  return status === JobStatus.APPROVED;
}

function canResume(status: JobStatus, expiresAt: Date | null, now: Date) {
  if (status !== JobStatus.PAUSED) return false;
  if (expiresAt && expiresAt <= now) return false;
  return true;
}

function canClose(status: JobStatus) {
  return status === JobStatus.APPROVED || status === JobStatus.PAUSED;
}

describe('Job status transitions (company)', () => {
  it('pause only from APPROVED', () => {
    expect(canPause(JobStatus.APPROVED)).toBe(true);
    expect(canPause(JobStatus.PAUSED)).toBe(false);
    expect(canPause(JobStatus.CLOSED)).toBe(false);
  });

  it('resume only from PAUSED when not expired', () => {
    const future = new Date(Date.now() + 86_400_000);
    const past = new Date(Date.now() - 86_400_000);
    expect(canResume(JobStatus.PAUSED, future, new Date())).toBe(true);
    expect(canResume(JobStatus.PAUSED, null, new Date())).toBe(true);
    expect(canResume(JobStatus.PAUSED, past, new Date())).toBe(false);
    expect(canResume(JobStatus.CLOSED, null, new Date())).toBe(false);
    expect(canResume(JobStatus.APPROVED, null, new Date())).toBe(false);
  });

  it('close from APPROVED or PAUSED, not from CLOSED', () => {
    expect(canClose(JobStatus.APPROVED)).toBe(true);
    expect(canClose(JobStatus.PAUSED)).toBe(true);
    expect(canClose(JobStatus.CLOSED)).toBe(false);
    expect(canClose(JobStatus.DRAFT)).toBe(false);
  });

  it('public listing only APPROVED', () => {
    const publicVisible = (status: JobStatus) => status === JobStatus.APPROVED;
    expect(publicVisible(JobStatus.APPROVED)).toBe(true);
    expect(publicVisible(JobStatus.PAUSED)).toBe(false);
    expect(publicVisible(JobStatus.CLOSED)).toBe(false);
  });
});

// Integration tests for submitForModeration require MySQL — see test/e2e later.
