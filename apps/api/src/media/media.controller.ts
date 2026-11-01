import {
  Controller,
  Get,
  Param,
  Post,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import type { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { memoryStorage } from 'multer';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { UploadMediaQueryDto } from './dto/upload-media-query.dto';
import { MediaService } from './media.service';

@ApiTags('media')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload tệp lên Cloudinary' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  upload(
    @CurrentUser() user: { userId: string; role: UserRole },
    @Query() query: UploadMediaQueryDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.mediaService.upload(
      BigInt(user.userId),
      user.role,
      query.assetType,
      file,
    );
  }

  @Get(':assetId/signed-url')
  @ApiOperation({ summary: 'URL ký thời hạn (CV / tệp riêng tư)' })
  signedUrl(
    @CurrentUser() user: { userId: string },
    @Param('assetId') assetId: string,
  ) {
    return this.mediaService.getSignedDownloadUrl(
      BigInt(user.userId),
      BigInt(assetId),
    );
  }

  @Get(':assetId/preview')
  @ApiOperation({
    summary: 'Xem / tải file qua API (PDF inline — dùng cho iframe CV upload)',
  })
  async preview(
    @CurrentUser() user: { userId: string },
    @Param('assetId') assetId: string,
    @Res() res: Response,
  ) {
    const asset = await this.mediaService.getAsset(
      BigInt(user.userId),
      BigInt(assetId),
    );
    const buffer = await this.mediaService.fetchAssetBuffer(asset);
    const mime = asset.mimeType ?? 'application/octet-stream';
    const filename =
      asset.originalFilename?.replace(/[^\w.\-() ]+/g, '_') ?? 'cv-file';
    res.setHeader('Content-Type', mime);
    res.setHeader('Content-Length', buffer.length);
    res.setHeader(
      'Content-Disposition',
      mime.includes('pdf')
        ? `inline; filename="${filename}"`
        : `attachment; filename="${filename}"`,
    );
    res.setHeader('Cache-Control', 'private, max-age=120');
    res.end(buffer);
  }

  @Get(':assetId')
  @ApiOperation({ summary: 'Metadata tệp (kiểm tra quyền)' })
  getOne(
    @CurrentUser() user: { userId: string },
    @Param('assetId') assetId: string,
  ) {
    return this.mediaService.getAsset(BigInt(user.userId), BigInt(assetId));
  }
}
