import { CategoryStatus, PrismaClient } from '@prisma/client';
import { CATEGORY_CATALOG } from './category-catalog';

const prisma = new PrismaClient();

async function main() {
  for (const category of CATEGORY_CATALOG) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: {
        ...category,
        description: `Danh mục ${category.categoryName}`,
        status: CategoryStatus.ACTIVE,
      },
    });
  }

  const activeCount = await prisma.category.count({
    where: { status: CategoryStatus.ACTIVE },
  });
  console.log(
    `Đã kiểm tra ${CATEGORY_CATALOG.length} danh mục mặc định; hiện có ${activeCount} danh mục đang hoạt động.`,
  );
}

main()
  .catch((error: unknown) => {
    console.error('Không thể khởi tạo danh mục nghề nghiệp:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
