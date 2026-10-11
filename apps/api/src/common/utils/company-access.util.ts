import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { CompanyProfile, PrismaClient } from '@prisma/client';

type PrismaLike = Pick<PrismaClient, 'companyProfile'>;

export async function getCompanyProfileForUser(
  prisma: PrismaLike,
  userId: bigint,
): Promise<CompanyProfile> {
  const company = await prisma.companyProfile.findUnique({
    where: { userId },
  });
  if (!company) {
    throw new NotFoundException('Không tìm thấy hồ sơ công ty');
  }
  return company;
}

export function assertCompanyOwnsJob(
  companyId: bigint,
  jobCompanyId: bigint,
): void {
  if (companyId !== jobCompanyId) {
    throw new ForbiddenException('Không có quyền với tin tuyển dụng này');
  }
}
