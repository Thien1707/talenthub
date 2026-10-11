import { ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';

export function assertStaffOrAdmin(role: UserRole): void {
  if (role !== UserRole.STAFF && role !== UserRole.SUPER_ADMIN) {
    throw new ForbiddenException('Chỉ nhân viên hoặc quản trị mới có quyền');
  }
}

export function assertSuperAdmin(role: UserRole): void {
  if (role !== UserRole.SUPER_ADMIN) {
    throw new ForbiddenException('Chỉ Super Admin mới có quyền');
  }
}
