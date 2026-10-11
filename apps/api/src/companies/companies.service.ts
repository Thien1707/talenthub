import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateCompanyProfileDto } from './dto/update-company-profile.dto';

@Injectable()
export class CompaniesService {
  constructor(private readonly prisma: PrismaService) {}

  async getMyProfile(userId: bigint) {
    const profile = await this.prisma.companyProfile.findUnique({
      where: { userId },
      include: { postingQuota: true, logoAsset: true },
    });
    if (!profile) {
      throw new NotFoundException('Chưa có hồ sơ công ty');
    }
    return profile;
  }

  async updateMyProfile(userId: bigint, dto: UpdateCompanyProfileDto) {
    await this.ensureCompanyUser(userId);
    const { logoAssetId, ...rest } = dto;
    if (logoAssetId) {
      const asset = await this.prisma.mediaAsset.findFirst({
        where: {
          assetId: BigInt(logoAssetId),
          ownerUserId: userId,
          deletedAt: null,
        },
      });
      if (!asset) {
        throw new NotFoundException('Logo không hợp lệ');
      }
    }
    return this.prisma.companyProfile.update({
      where: { userId },
      data: {
        ...rest,
        ...(logoAssetId !== undefined
          ? { logoAssetId: logoAssetId ? BigInt(logoAssetId) : null }
          : {}),
      },
      include: { postingQuota: true, logoAsset: true },
    });
  }

  async getPublicProfile(companyId: bigint) {
    const profile = await this.prisma.companyProfile.findUnique({
      where: { companyId },
      select: {
        companyId: true,
        companyName: true,
        industry: true,
        companySize: true,
        website: true,
        description: true,
        address: true,
        city: true,
        verificationStatus: true,
        logoAssetId: true,
      },
    });
    if (!profile) {
      throw new NotFoundException('Không tìm thấy công ty');
    }
    return profile;
  }

  private async ensureCompanyUser(userId: bigint) {
    const user = await this.prisma.user.findFirst({
      where: { userId, role: UserRole.COMPANY, deletedAt: null },
    });
    if (!user) {
      throw new NotFoundException('Tài khoản công ty không hợp lệ');
    }
  }
}
