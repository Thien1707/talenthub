import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CategoryStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  listActive() {
    return this.prisma.category.findMany({
      where: { status: CategoryStatus.ACTIVE },
      orderBy: { categoryName: 'asc' },
    });
  }

  listAll() {
    return this.prisma.category.findMany({
      orderBy: { categoryName: 'asc' },
    });
  }

  async create(dto: CreateCategoryDto) {
    try {
      return await this.prisma.category.create({
        data: {
          categoryName: dto.categoryName,
          slug: dto.slug,
          description: dto.description,
          parentCategoryId: dto.parentCategoryId
            ? BigInt(dto.parentCategoryId)
            : undefined,
        },
      });
    } catch {
      throw new ConflictException('Danh mục hoặc slug đã tồn tại');
    }
  }

  async update(id: bigint, dto: UpdateCategoryDto) {
    await this.ensureExists(id);
    try {
      return await this.prisma.category.update({
        where: { categoryId: id },
        data: dto,
      });
    } catch {
      throw new ConflictException('Danh mục hoặc slug đã tồn tại');
    }
  }

  private async ensureExists(id: bigint) {
    const cat = await this.prisma.category.findUnique({
      where: { categoryId: id },
    });
    if (!cat) throw new NotFoundException('Không tìm thấy danh mục');
  }
}
