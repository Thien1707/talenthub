import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SUPER_ADMIN_RESET_EMAIL?.trim().toLowerCase();
  const password = process.env.SUPER_ADMIN_RESET_PASSWORD;

  if (!email || !password) {
    throw new Error(
      'Cần đặt SUPER_ADMIN_RESET_EMAIL và SUPER_ADMIN_RESET_PASSWORD trước khi chạy.',
    );
  }
  if (password.length < 8) {
    throw new Error('Mật khẩu mới phải có ít nhất 8 ký tự.');
  }

  const account = await prisma.user.findUnique({
    where: { email },
    select: { userId: true, role: true, deletedAt: true },
  });

  if (account && (account.deletedAt || account.role !== UserRole.SUPER_ADMIN)) {
    throw new Error(
      'Không tìm thấy tài khoản Super Admin hợp lệ với email này.',
    );
  }

  const passwordHash = await argon2.hash(password);
  if (!account) {
    await prisma.user.create({
      data: {
        email,
        passwordHash,
        fullName: 'Super Admin',
        role: UserRole.SUPER_ADMIN,
        status: UserStatus.ACTIVE,
        emailVerifiedAt: new Date(),
      },
    });
    console.log('Đã tạo tài khoản Super Admin mới với mật khẩu đã nhập.');
    return;
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { userId: account.userId },
      data: { passwordHash },
    }),
    prisma.refreshToken.updateMany({
      where: { userId: account.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
  ]);

  console.log(
    'Đã đặt lại mật khẩu Super Admin và thu hồi các refresh token hiện có.',
  );
}

main()
  .catch((error: unknown) => {
    console.error(
      error instanceof Error
        ? error.message
        : 'Không thể đặt lại mật khẩu Super Admin.',
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
