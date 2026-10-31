import {
  PlanType,
  PrismaClient,
  UserRole,
  UserStatus,
} from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  const categories = [
    { categoryName: 'Công nghệ thông tin', slug: 'cong-nghe-thong-tin' },
    { categoryName: 'Marketing', slug: 'marketing' },
    { categoryName: 'Kế toán', slug: 'ke-toan' },
    { categoryName: 'Kinh doanh', slug: 'kinh-doanh' },
    { categoryName: 'Nhân sự', slug: 'nhan-su' },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: {
        categoryName: cat.categoryName,
        slug: cat.slug,
        description: `Danh mục ${cat.categoryName}`,
      },
    });
  }

  const plans = [
    {
      planName: 'Đăng tin thường',
      planType: PlanType.NORMAL_POST,
      price: 199000,
      durationDays: 30,
    },
    {
      planName: 'Đăng tin VIP',
      planType: PlanType.VIP_POST,
      price: 499000,
      durationDays: 30,
    },
    {
      planName: 'Gói 5 tin thường',
      planType: PlanType.PACKAGE,
      price: 899000,
      includedPosts: 5,
      durationDays: 90,
    },
  ];

  for (const plan of plans) {
    const existing = await prisma.pricingPlan.findFirst({
      where: { planName: plan.planName },
    });
    if (!existing) {
      await prisma.pricingPlan.create({ data: plan });
    }
  }

  const templates = [
    {
      templateName: 'Cổ điển',
      description: 'Bố cục truyền thống, dễ đọc',
      templateConfig: {
        layout: 'classic',
        primaryColor: '#1e40af',
        accentColor: '#1e40af',
        fontFamily: 'Inter',
      },
    },
    {
      templateName: 'Hiện đại',
      description: 'Tối giản, nhấn mạnh kinh nghiệm',
      templateConfig: {
        layout: 'modern',
        primaryColor: '#0f766e',
        accentColor: '#0f766e',
        fontFamily: 'Inter',
      },
    },
    {
      templateName: 'TopCV (1 cột)',
      description:
        'Bố cục một cột kiểu TopCV — mục tiêu, học vấn, kinh nghiệm, kỹ năng',
      templateConfig: {
        layout: 'topcv',
        primaryColor: '#00b14f',
        accentColor: '#00b14f',
        fontFamily: 'Inter',
      },
    },
  ];

  const activeNames = new Set(templates.map((t) => t.templateName));

  for (const tpl of templates) {
    const existing = await prisma.cvTemplate.findFirst({
      where: { templateName: tpl.templateName },
    });
    if (existing) {
      await prisma.cvTemplate.update({
        where: { templateId: existing.templateId },
        data: {
          description: tpl.description,
          templateConfig: tpl.templateConfig,
          isActive: true,
        },
      });
    } else {
      await prisma.cvTemplate.create({ data: tpl });
    }
  }

  const allTpl = await prisma.cvTemplate.findMany();
  for (const row of allTpl) {
    if (!activeNames.has(row.templateName) && row.isActive) {
      await prisma.cvTemplate.update({
        where: { templateId: row.templateId },
        data: { isActive: false },
      });
    }
  }

  const superEmail =
    process.env.SUPER_ADMIN_EMAIL ?? 'superadmin@talenthub.local';
  const superPassword =
    process.env.SUPER_ADMIN_PASSWORD ?? 'ChangeMe_SuperAdmin_123!';

  const passwordHash = await argon2.hash(superPassword);

  await prisma.user.upsert({
    where: { email: superEmail },
    update: {},
    create: {
      email: superEmail,
      passwordHash,
      fullName: 'Super Admin',
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: new Date(),
    },
  });

  const staffEmail =
    process.env.STAFF_SEED_EMAIL ?? 'staff@talenthub.local';
  const staffPassword =
    process.env.STAFF_SEED_PASSWORD ?? 'ChangeMe_Staff_123!';
  const staffHash = await argon2.hash(staffPassword);
  const staffUser = await prisma.user.upsert({
    where: { email: staffEmail },
    update: {},
    create: {
      email: staffEmail,
      passwordHash: staffHash,
      fullName: 'Moderation Staff',
      role: UserRole.STAFF,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: new Date(),
    },
  });
  await prisma.staffProfile.upsert({
    where: { userId: staffUser.userId },
    update: {},
    create: {
      userId: staffUser.userId,
      employeeCode: 'STAFF001',
      department: 'Moderation',
      position: 'Staff',
      hiredAt: new Date(),
    },
  });

  console.log('Seed hoàn tất.');
  console.log(
    `Super Admin (chỉ dev): ${superEmail} — đặt SUPER_ADMIN_* trong .env cho production.`,
  );
  console.log(
    `Staff seed (dev): ${staffEmail} / ${staffPassword} — STAFF_SEED_* trong .env`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
