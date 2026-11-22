import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, UserRole, WorkScheduleType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { calculateJobMatchScore } from '../jobs/job-matching.util';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';
import { UpdateStudentProfileDto } from './dto/update-student-profile.dto';

@Injectable()
export class StudentsService {
  constructor(private readonly prisma: PrismaService) {}

  async getMyProfile(userId: bigint) {
    const profile = await this.prisma.studentProfile.findUnique({
      where: { userId },
      include: { availabilities: true },
    });
    if (!profile) {
      throw new NotFoundException('Chưa có hồ sơ sinh viên');
    }
    return profile;
  }

  async updateMyProfile(userId: bigint, dto: UpdateStudentProfileDto) {
    await this.ensureStudentUser(userId);
    return this.prisma.studentProfile.upsert({
      where: { userId },
      create: {
        userId,
        ...dto,
      },
      update: dto,
    });
  }

  async upsertAvailability(userId: bigint, dto: UpdateAvailabilityDto) {
    await this.ensureStudentUser(userId);

    return this.prisma.$transaction(async (tx) => {
      const profile = await tx.studentProfile.upsert({
        where: { userId },
        create: {
          userId,
          workScheduleType: dto.slots[0]?.workScheduleType ?? WorkScheduleType.PART_TIME,
        },
        update: {
          workScheduleType: dto.slots[0]?.workScheduleType ?? undefined,
        },
      });

      await tx.studentAvailability.deleteMany({ where: { userId } });
      const rows = dto.slots.map((slot) => ({
        userId,
        studentProfileId: profile.studentProfileId,
        dayOfWeek: slot.dayOfWeek,
        startTime: slot.startTime,
        endTime: slot.endTime,
        workScheduleType: slot.workScheduleType ?? profile.workScheduleType ?? WorkScheduleType.PART_TIME,
      }));

      await tx.studentAvailability.createMany({ data: rows });
      return {
        count: rows.length,
        slots: rows,
      };
    });
  }

  async getMatchingJobs(userId: bigint) {
    await this.ensureStudentUser(userId);

    const [profile, availabilities] = await Promise.all([
      this.prisma.studentProfile.findUnique({
        where: { userId },
      }),
      this.prisma.studentAvailability.findMany({
        where: { userId },
        orderBy: { dayOfWeek: 'asc' },
      }),
    ]);

    if (!profile) {
      throw new NotFoundException('Chưa có hồ sơ sinh viên');
    }

    const jobs = await this.prisma.job.findMany({
      where: {
        status: 'APPROVED',
        deletedAt: null,
      },
      include: {
        schedules: true,
      },
    });

    const candidateAvailability = availabilities.map((slot) => ({
      dayOfWeek: slot.dayOfWeek,
      startTime: slot.startTime,
      endTime: slot.endTime,
    }));

    const matches = jobs
      .map((job) => {
        const score = calculateJobMatchScore({
          candidateProvince: profile.preferredProvince ?? profile.province,
          candidateWard: profile.preferredWard ?? profile.ward,
          jobProvince: job.province,
          jobWard: job.ward,
          candidateAvailability,
          jobSchedules: job.schedules.map((schedule) => ({
            dayOfWeek: schedule.dayOfWeek,
            startTime: schedule.startTime,
            endTime: schedule.endTime,
          })),
          candidateWorkScheduleType: profile.workScheduleType ?? undefined,
          jobWorkScheduleType: job.workScheduleType ?? undefined,
        });

        return {
          jobId: job.jobId.toString(),
          title: job.title,
          province: job.province,
          ward: job.ward,
          detailAddress: job.detailAddress,
          workScheduleType: job.workScheduleType,
          ...score,
        };
      })
      .filter((item) => item.score !== null)
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

    return matches;
  }

  private async ensureStudentUser(userId: bigint) {
    const user = await this.prisma.user.findFirst({
      where: { userId, role: UserRole.STUDENT, deletedAt: null },
    });
    if (!user) {
      throw new NotFoundException('Tài khoản sinh viên không hợp lệ');
    }
  }
}
