import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AssetType, CvSourceType, Prisma, UserRole } from '@prisma/client';
import { MediaService } from '../media/media.service';
import { PrismaService } from '../prisma/prisma.service';
import { resolveCvLayout } from './cv-layout.util';
import {
  createModernPdfDocument,
  renderModernCvPdf,
} from './cv-pdf-modern.render';
import {
  createTopCvPdfDocument,
  renderTopCvPdf,
} from './cv-pdf-topcv.render';
import { CvContent, emptyCvContent } from './cv-content.schema';
import { CreateCvDto } from './dto/create-cv.dto';
import { UpdateCvDto } from './dto/update-cv.dto';
import { resolvePdfUnicodeFontPath } from './pdf-font.util';
import { extractPlainTextFromPdf } from './pdf-text.util';

@Injectable()
export class CvsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly media: MediaService,
  ) {}

  listTemplates() {
    return this.prisma.cvTemplate.findMany({
      where: { isActive: true },
      orderBy: { templateName: 'asc' },
    });
  }

  async listMyCvs(userId: bigint) {
    await this.ensureStudent(userId);
    return this.prisma.cv.findMany({
      where: { studentUserId: userId, deletedAt: null },
      include: {
        template: true,
        currentVersion: { include: { fileAsset: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async createCv(userId: bigint, dto: CreateCvDto) {
    await this.ensureStudent(userId);
    const user = await this.prisma.user.findUnique({ where: { userId } });
    const content =
      dto.contentJson ??
      emptyCvContent(user?.fullName, user?.email ?? undefined);

    return this.prisma.$transaction(async (tx) => {
      const cv = await tx.cv.create({
        data: {
          studentUserId: userId,
          templateId: dto.templateId ? BigInt(dto.templateId) : null,
          cvName: dto.cvName,
        },
      });
      const version = await tx.cvVersion.create({
        data: {
          cvId: cv.cvId,
          versionNumber: 1,
          sourceType: CvSourceType.BUILDER,
          contentJson: content as Prisma.InputJsonValue,
          plainTextContent: JSON.stringify(content),
          createdBy: userId,
        },
      });
      return tx.cv.update({
        where: { cvId: cv.cvId },
        data: { currentVersionId: version.cvVersionId },
        include: { currentVersion: true, template: true },
      });
    });
  }

  async updateCv(userId: bigint, cvId: bigint, dto: UpdateCvDto) {
    await this.ensureStudent(userId);
    const cv = await this.getOwnedCv(userId, cvId);
    if (!dto.contentJson && !dto.cvName && !dto.templateId) {
      return cv;
    }

    return this.prisma.$transaction(async (tx) => {
      if (dto.cvName || dto.templateId) {
        await tx.cv.update({
          where: { cvId },
          data: {
            ...(dto.cvName ? { cvName: dto.cvName } : {}),
            ...(dto.templateId
              ? { templateId: BigInt(dto.templateId) }
              : {}),
          },
        });
      }
      if (dto.contentJson) {
        const last = await tx.cvVersion.findFirst({
          where: { cvId },
          orderBy: { versionNumber: 'desc' },
        });
        const versionNumber = (last?.versionNumber ?? 0) + 1;
        const version = await tx.cvVersion.create({
          data: {
            cvId,
            versionNumber,
            sourceType: CvSourceType.BUILDER,
            contentJson: dto.contentJson as Prisma.InputJsonValue,
            plainTextContent: JSON.stringify(dto.contentJson),
            createdBy: userId,
          },
        });
        await tx.cv.update({
          where: { cvId },
          data: { currentVersionId: version.cvVersionId },
        });
      }
      return tx.cv.findUnique({
        where: { cvId },
        include: { currentVersion: true, template: true },
      });
    });
  }

  async getCv(userId: bigint, cvId: bigint) {
    return this.getOwnedCv(userId, cvId, true);
  }

  async deleteCv(userId: bigint, cvId: bigint) {
    await this.ensureStudent(userId);
    await this.getOwnedCv(userId, cvId, false);
    const used = await this.prisma.application.count({
      where: {
        cvVersion: { cvId },
      },
    });
    if (used > 0) {
      throw new BadRequestException(
        'CV đã được dùng ứng tuyển — không thể xóa. Tạo CV mới nếu cần.',
      );
    }
    await this.prisma.cv.update({
      where: { cvId },
      data: { deletedAt: new Date() },
    });
    return { success: true, cvId: cvId.toString() };
  }

  async duplicateCv(userId: bigint, cvId: bigint) {
    await this.ensureStudent(userId);
    const source = await this.getOwnedCv(userId, cvId, false);
    const ver = source.currentVersion;
    if (!ver) {
      throw new BadRequestException('CV không có phiên bản để sao chép');
    }
    if (ver.sourceType === CvSourceType.UPLOAD) {
      throw new BadRequestException(
        'Không sao chép CV dạng upload PDF — tạo CV builder mới hoặc upload lại',
      );
    }
    const content = ver.contentJson as CvContent | null;
    return this.createCv(userId, {
      cvName: `${source.cvName} (bản sao)`,
      templateId: source.templateId?.toString(),
      contentJson: (content ?? emptyCvContent()) as Record<string, unknown>,
    });
  }

  private async getOwnedCv(
    userId: bigint,
    cvId: bigint,
    withVersions = false,
  ) {
    const cv = await this.prisma.cv.findFirst({
      where: { cvId, studentUserId: userId, deletedAt: null },
      include: {
        template: true,
        currentVersion: { include: { fileAsset: true } },
        versions: withVersions
          ? { orderBy: { versionNumber: 'desc' }, take: 20 }
          : false,
      },
    });
    if (!cv) throw new NotFoundException('Không tìm thấy CV');
    return cv;
  }

  async uploadPdfFile(
    userId: bigint,
    file: Express.Multer.File,
    options?: { cvName?: string; cvId?: bigint },
  ) {
    await this.ensureStudent(userId);
    if (!file?.buffer?.length) {
      throw new BadRequestException('Thiếu file PDF');
    }
    if (file.mimetype !== 'application/pdf') {
      throw new BadRequestException('Chỉ chấp nhận file PDF');
    }

    const plainText = await extractPlainTextFromPdf(file.buffer);

    const asset = await this.media.upload(
      userId,
      UserRole.STUDENT,
      AssetType.CV,
      file,
    );

    const cvName =
      options?.cvName?.trim() ||
      file.originalname?.replace(/\.pdf$/i, '') ||
      'CV upload';

    return this.prisma.$transaction(async (tx) => {
      let cvId = options?.cvId;
      if (cvId) {
        const owned = await tx.cv.findFirst({
          where: { cvId, studentUserId: userId, deletedAt: null },
        });
        if (!owned) throw new NotFoundException('Không tìm thấy CV');
      } else {
        const cv = await tx.cv.create({
          data: { studentUserId: userId, cvName },
        });
        cvId = cv.cvId;
      }

      const last = await tx.cvVersion.findFirst({
        where: { cvId },
        orderBy: { versionNumber: 'desc' },
      });
      const versionNumber = (last?.versionNumber ?? 0) + 1;
      const version = await tx.cvVersion.create({
        data: {
          cvId,
          versionNumber,
          sourceType: CvSourceType.UPLOAD,
          fileAssetId: asset.assetId,
          plainTextContent: plainText,
          createdBy: userId,
        },
      });
      await tx.cv.update({
        where: { cvId },
        data: { cvName, currentVersionId: version.cvVersionId },
      });
      return tx.cv.findUnique({
        where: { cvId },
        include: { currentVersion: { include: { fileAsset: true } }, template: true },
      });
    });
  }

  async exportPdf(userId: bigint, cvId: bigint): Promise<Buffer> {
    const cv = await this.getOwnedCv(userId, cvId, true);
    const raw = cv.currentVersion?.contentJson as CvContent | null;
    const content = raw ?? emptyCvContent();
    const layout = resolveCvLayout(cv.template?.templateConfig);
    return this.renderPdfBuffer(cv.cvName, content, layout);
  }

  async exportPdfForApplication(
    companyUserId: bigint,
    applicationId: bigint,
  ): Promise<Buffer> {
    const company = await this.prisma.companyProfile.findFirst({
      where: { userId: companyUserId },
    });
    if (!company) {
      throw new ForbiddenException('Chỉ công ty mới xem được CV ứng viên');
    }
    const app = await this.prisma.application.findFirst({
      where: {
        applicationId,
        job: { companyId: company.companyId },
      },
      include: {
        cvVersion: { include: { cv: { include: { template: true } } } },
      },
    });
    if (!app) throw new NotFoundException('Không tìm thấy hồ sơ');
    if (app.cvVersion.sourceType === CvSourceType.UPLOAD) {
      throw new BadRequestException(
        'CV dạng PDF upload — dùng nút mở file có URL ký',
      );
    }
    const raw = app.cvVersion.contentJson as CvContent | null;
    const layout = resolveCvLayout(app.cvVersion.cv.template?.templateConfig);
    return this.renderPdfBuffer(
      app.cvVersion.cv.cvName,
      raw ?? emptyCvContent(),
      layout,
    );
  }

  private renderPdfBuffer(
    cvName: string,
    content: CvContent,
    layout = resolveCvLayout(null),
  ): Promise<Buffer> {
    const fontPath = resolvePdfUnicodeFontPath();
    const useTopCv = layout === 'topcv';
    return new Promise((resolve, reject) => {
      const doc = useTopCv
        ? createTopCvPdfDocument()
        : createModernPdfDocument();
      const chunks: Buffer[] = [];
      doc.on('data', (c: Buffer) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
      if (useTopCv) {
        renderTopCvPdf(doc, cvName, content, fontPath);
      } else {
        renderModernCvPdf(doc, cvName, content, fontPath);
      }
      doc.end();
    });
  }

  private async ensureStudent(userId: bigint) {
    const user = await this.prisma.user.findFirst({
      where: { userId, role: UserRole.STUDENT, deletedAt: null },
    });
    if (!user) throw new ForbiddenException('Chỉ sinh viên mới dùng được CV');
  }
}
