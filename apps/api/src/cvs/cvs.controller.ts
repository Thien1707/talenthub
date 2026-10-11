import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Response } from 'express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CvsService } from './cvs.service';
import { CreateCvDto } from './dto/create-cv.dto';
import { UpdateCvDto } from './dto/update-cv.dto';

@ApiTags('cvs')
@Controller('cvs')
export class CvsController {
  constructor(private readonly cvsService: CvsService) {}

  @Get('templates')
  @ApiOperation({ summary: 'Danh sách mẫu CV' })
  templates() {
    return this.cvsService.listTemplates();
  }

  @Get('me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'CV của tôi' })
  listMine(@CurrentUser() user: { userId: string }) {
    return this.cvsService.listMyCvs(BigInt(user.userId));
  }

  @Post('me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Tạo CV mới' })
  create(@CurrentUser() user: { userId: string }, @Body() dto: CreateCvDto) {
    return this.cvsService.createCv(BigInt(user.userId), dto);
  }

  @Post('me/upload')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Upload CV PDF (Cloudinary private)' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  uploadPdf(
    @CurrentUser() user: { userId: string },
    @UploadedFile() file: Express.Multer.File,
    @Query('cvName') cvName?: string,
    @Query('cvId') cvId?: string,
  ) {
    return this.cvsService.uploadPdfFile(BigInt(user.userId), file, {
      cvName,
      cvId: cvId ? BigInt(cvId) : undefined,
    });
  }

  @Get('me/:cvId/export/pdf')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Xuất CV PDF' })
  async exportPdf(
    @CurrentUser() user: { userId: string },
    @Param('cvId') cvId: string,
    @Res() res: Response,
  ) {
    const buffer = await this.cvsService.exportPdf(
      BigInt(user.userId),
      BigInt(cvId),
    );
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', buffer.length);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="cv-${cvId}.pdf"`,
    );
    res.end(buffer);
  }

  @Get('me/:cvId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Chi tiết CV' })
  getOne(
    @CurrentUser() user: { userId: string },
    @Param('cvId') cvId: string,
  ) {
    return this.cvsService.getCv(BigInt(user.userId), BigInt(cvId));
  }

  @Patch('me/:cvId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Cập nhật CV (tạo version mới nếu đổi nội dung)' })
  update(
    @CurrentUser() user: { userId: string },
    @Param('cvId') cvId: string,
    @Body() dto: UpdateCvDto,
  ) {
    return this.cvsService.updateCv(BigInt(user.userId), BigInt(cvId), dto);
  }

  @Post('me/:cvId/duplicate')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Nhân bản CV (builder)' })
  duplicate(
    @CurrentUser() user: { userId: string },
    @Param('cvId') cvId: string,
  ) {
    return this.cvsService.duplicateCv(BigInt(user.userId), BigInt(cvId));
  }

  @Delete('me/:cvId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Xóa CV (soft delete)' })
  remove(
    @CurrentUser() user: { userId: string },
    @Param('cvId') cvId: string,
  ) {
    return this.cvsService.deleteCv(BigInt(user.userId), BigInt(cvId));
  }
}
