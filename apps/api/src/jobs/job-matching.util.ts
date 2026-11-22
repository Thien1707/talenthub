export type CandidateAvailabilitySlot = {
  dayOfWeek?: string | null;
  startTime?: string | null;
  endTime?: string | null;
};

export type JobScheduleSlot = {
  dayOfWeek?: string | null;
  startTime?: string | null;
  endTime?: string | null;
};

const DAY_ORDER: Record<string, number> = {
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
  SUNDAY: 7,
};

function normalizeText(value?: string | null) {
  return (value ?? '').trim().toLowerCase();
}

function toMinutes(value?: string | null): number | null {
  if (!value) return null;
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value.trim());
  if (!match) return null;
  const [, hour, minute] = match;
  return Number(hour) * 60 + Number(minute);
}

function computeLocationScore(
  candidateProvince?: string | null,
  candidateWard?: string | null,
  jobProvince?: string | null,
  jobWard?: string | null,
) {
  if (!candidateProvince || !jobProvince) {
    return null;
  }
  const sameProvince = normalizeText(candidateProvince) === normalizeText(jobProvince);
  if (!sameProvince) {
    return 0;
  }

  if (normalizeText(candidateWard) && normalizeText(jobWard)) {
    return normalizeText(candidateWard) === normalizeText(jobWard) ? 40 : 25;
  }

  return 20;
}

function computeTimeScore(
  candidateSlots: CandidateAvailabilitySlot[] = [],
  jobSlots: JobScheduleSlot[] = [],
) {
  if (!candidateSlots.length || !jobSlots.length) {
    return null;
  }

  const coverageByDay = new Map<string, number[]>();

  for (const candidate of candidateSlots) {
    const day = normalizeText(candidate.dayOfWeek);
    if (!day) continue;
    const start = toMinutes(candidate.startTime);
    const end = toMinutes(candidate.endTime);
    if (start == null || end == null || end <= start) continue;

    const existing = coverageByDay.get(day) ?? [];
    existing.push(start);
    existing.push(end);
    coverageByDay.set(day, existing);
  }

  if (!coverageByDay.size) {
    return null;
  }

  let totalCoverage = 0;
  let matchedJobs = 0;

  for (const jobSlot of jobSlots) {
    const day = normalizeText(jobSlot.dayOfWeek);
    if (!day) continue;
    const jobStart = toMinutes(jobSlot.startTime);
    const jobEnd = toMinutes(jobSlot.endTime);
    if (jobStart == null || jobEnd == null || jobEnd <= jobStart) continue;

    matchedJobs += 1;
    const candidateWindows = coverageByDay.get(day) ?? [];
    if (candidateWindows.length === 0) {
      totalCoverage += 0;
      continue;
    }

    const candidateStart = candidateWindows[0] ?? jobStart;
    const candidateEnd = candidateWindows[1] ?? jobEnd;
    const overlapStart = Math.max(jobStart, candidateStart);
    const overlapEnd = Math.min(jobEnd, candidateEnd);
    const overlap = Math.max(0, overlapEnd - overlapStart);
    const duration = Math.max(1, jobEnd - jobStart);
    const percent = Math.min(1, overlap / duration);
    totalCoverage += percent;
  }

  if (matchedJobs === 0) {
    return null;
  }

  const average = totalCoverage / matchedJobs;
  return Math.round(Math.max(0, Math.min(100, average * 100)));
}

function computeTypeScore(
  candidateWorkScheduleType?: string | null,
  jobWorkScheduleType?: string | null,
) {
  if (!candidateWorkScheduleType || !jobWorkScheduleType) {
    return null;
  }
  return normalizeText(candidateWorkScheduleType) === normalizeText(jobWorkScheduleType)
    ? 20
    : 0;
}

export function calculateJobMatchScore(input: {
  candidateProvince?: string | null;
  candidateWard?: string | null;
  jobProvince?: string | null;
  jobWard?: string | null;
  candidateAvailability?: CandidateAvailabilitySlot[];
  jobSchedules?: JobScheduleSlot[];
  candidateWorkScheduleType?: string | null;
  jobWorkScheduleType?: string | null;
}) {
  const locationScore = computeLocationScore(
    input.candidateProvince,
    input.candidateWard,
    input.jobProvince,
    input.jobWard,
  );
  const timeScore = computeTimeScore(
    input.candidateAvailability ?? [],
    input.jobSchedules ?? [],
  );
  const typeScore = computeTypeScore(
    input.candidateWorkScheduleType,
    input.jobWorkScheduleType,
  );

  const weightedScores = [locationScore, timeScore, typeScore].filter(
    (score): score is number => score !== null,
  );

  if (!weightedScores.length) {
    return {
      score: null,
      label: 'Chưa đủ dữ liệu',
      locationScore,
      timeScore,
      typeScore,
      reason: 'Thiếu thông tin khu vực hoặc lịch làm việc để đánh giá',
    };
  }

  let score = 0;
  if (locationScore !== null) score += (locationScore / 40) * 40;
  if (timeScore !== null) score += (timeScore / 100) * 40;
  if (typeScore !== null) score += (typeScore / 20) * 20;

  const rounded = Math.round(score);
  const clamped = Math.max(0, Math.min(100, rounded));

  let label = 'Ít phù hợp';
  if (clamped >= 80) label = 'Rất phù hợp';
  else if (clamped >= 60) label = 'Phù hợp';
  else if (clamped >= 40) label = 'Tương đối phù hợp';

  return {
    score: clamped,
    label,
    locationScore,
    timeScore,
    typeScore,
  };
}

export function buildCandidateScheduleMap(slots: CandidateAvailabilitySlot[] = []) {
  const map = new Map<string, CandidateAvailabilitySlot[]>();
  for (const slot of slots) {
    const day = normalizeText(slot.dayOfWeek);
    if (!day) continue;
    const list = map.get(day) ?? [];
    list.push(slot);
    map.set(day, list);
  }
  return map;
}

export function getDayPriority(day: string | null | undefined) {
  return DAY_ORDER[normalizeText(day).toUpperCase()] ?? 999;
}
