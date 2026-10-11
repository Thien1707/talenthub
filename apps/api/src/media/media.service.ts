import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AssetStatus, AssetType, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from './cloudinary.service';

const IMAGE_MIMES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);
const DOC_MIMES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

@Injectable()
export class MediaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  async upload(
    userId: bigint,
    role: UserRole,
    assetType: AssetType,
    file: Express.Multer.File,
  ) {
    this.assertRoleForAssetType(role, assetType);
    if (!file?.buffer?.length) {
      throw new BadRequestException('Thiếu file upload');
    }

    const isImage =
      assetType === AssetType.AVATAR ||
      assetType === AssetType.COMPANY_LOGO ||
      assetType === AssetType.CV_PREVIEW;
    const isDoc =
      assetType === AssetType.CV || assetType === AssetType.CHAT_ATTACHMENT;

    if (isImage && !IMAGE_MIMES.has(file.mimetype)) {
      throw new BadRequestException('Ảnh phải là JPEG, PNG, WebP hoặc GIF');
    }
    if (isDoc && !DOC_MIMES.has(file.mimetype) && !IMAGE_MIMES.has(file.mimetype)) {
      throw new BadRequestException('Định dạng file không được hỗ trợ');
    }

    const maxBytes =
      assetType === AssetType.CV ? 10 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxBytes) {
      throw new BadRequestException('File vượt quá dung lượng cho phép');
    }

    const folder = `talenthub/${assetType.toLowerCase()}/${userId.toString()}`;
    const resourceType =
      isImage && !file.mimetype.includes('pdf') ? 'image' : 'raw';
    const privateAsset =
      assetType === AssetType.CV || assetType === AssetType.CHAT_ATTACHMENT;
    const deliveryType = privateAsset ? 'authenticated' : 'upload';

    const result = await this.cloudinary.uploadBuffer(file.buffer, {
      folder,
      resourceType,
      deliveryType,
    });

    return this.prisma.mediaAsset.create({
      data: {
        ownerUserId: userId,
        assetType,
        provider: 'CLOUDINARY',
        publicId: result.public_id,
        resourceType: result.resource_type ?? resourceType,
        cloudinaryType: deliveryType,
        secureUrl: result.secure_url,
        originalFilename: file.originalname?.slice(0, 255) ?? null,
        mimeType: file.mimetype,
        fileSize: BigInt(file.size),
        width: result.width ?? null,
        height: result.height ?? null,
        status: AssetStatus.ACTIVE,
      },
    });
  }

  async getAsset(userId: bigint, assetId: bigint) {
    const asset = await this.prisma.mediaAsset.findFirst({
      where: { assetId, deletedAt: null, status: AssetStatus.ACTIVE },
    });
    if (!asset) throw new NotFoundException('Không tìm thấy tệp');
    if (!(await this.canAccessAsset(userId, asset))) {
      throw new ForbiddenException('Không có quyền truy cập tệp');
    }
    return asset;
  }

  async getSignedDownloadUrl(userId: bigint, assetId: bigint) {
    const asset = await this.prisma.mediaAsset.findFirst({
      where: { assetId, deletedAt: null, status: AssetStatus.ACTIVE },
    });
    if (!asset) throw new NotFoundException('Không tìm thấy tệp');

    const allowed = await this.canAccessAsset(userId, asset);
    if (!allowed) {
      throw new ForbiddenException('Không có quyền truy cập tệp');
    }

    const deliveryType =
      asset.cloudinaryType === 'authenticated' ? 'authenticated' : 'upload';
    const url = this.cloudinary.getSignedUrl(
      asset.publicId,
      asset.resourceType,
      deliveryType,
    );
    return { assetId: asset.assetId.toString(), signedUrl: url, expiresIn: 3600 };
  }

  private async canAccessAsset(
    userId: bigint,
    asset: { assetId: bigint; ownerUserId: bigint; assetType: AssetType },
  ) {
    if (asset.ownerUserId === userId) return true;
    if (asset.assetType === AssetType.CHAT_ATTACHMENT) {
      return this.canAccessChatAttachment(userId, asset.assetId);
    }
    if (asset.assetType === AssetType.CV) {
      return this.canAccessCvFile(userId, asset.assetId);
    }
    return false;
  }

  private async canAccessCvFile(userId: bigint, assetId: bigint) {
    const version = await this.prisma.cvVersion.findFirst({
      where: { fileAssetId: assetId },
      include: { cv: true },
    });
    if (!version) return false;
    if (version.cv.studentUserId === userId) return true;
    const company = await this.prisma.companyProfile.findUnique({
      where: { userId },
    });
    if (!company) return false;
    const applied = await this.prisma.application.findFirst({
      where: {
        cvVersionId: version.cvVersionId,
        job: { companyId: company.companyId },
      },
    });
    return !!applied;
  }

  private async canAccessChatAttachment(userId: bigint, assetId: bigint) {
    const msg = await this.prisma.message.findFirst({
      where: { assetId, deletedAt: null },
      include: {
        conversation: {
          include: {
            members: { where: { userId, leftAt: null } },
          },
        },
      },
    });
    return (msg?.conversation.members.length ?? 0) > 0;
  }

  private assertRoleForAssetType(role: UserRole, assetType: AssetType) {
    if (assetType === AssetType.COMPANY_LOGO && role !== UserRole.COMPANY) {
      throw new ForbiddenException('Chỉ công ty mới upload logo');
    }
    if (assetType === AssetType.CV && role !== UserRole.STUDENT) {
      throw new ForbiddenException('Chỉ sinh viên mới upload CV');
    }
  }
}
