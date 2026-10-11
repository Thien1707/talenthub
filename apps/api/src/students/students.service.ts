import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateStudentProfileDto } from './dto/update-student-profile.dto';

@Injectable()
export class StudentsService {
  constructor(private readonly prisma: PrismaService) {}

  async getMyProfile(userId: bigint) {
    const profile = await this.prisma.studentProfile.findUnique({
      where: { userId },
    });
    if (!profile) {
      throw new NotFoundException('Chưa có hồ sơ sinh viên');
    }
    return profile;
  }

  async updateMyProfile(userId: bigint, dto: UpdateStudentProfileDto) {
    await this.ensureStudentUser(userId);
    return this.prisma.studentProfile.update({
      where: { userId },
      data: dto,
    });
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
