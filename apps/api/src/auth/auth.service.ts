import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserRole, UserStatus } from '@prisma/client';
import * as argon2 from 'argon2';
import { createHash, randomBytes } from 'crypto';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterCompanyDto } from './dto/register-company.dto';
import { RegisterStudentDto } from './dto/register-student.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly mail: MailService,
  ) {}

  async registerStudent(dto: RegisterStudentDto) {
    await this.ensureEmailAvailable(dto.email);
    const passwordHash = await argon2.hash(dto.password);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        fullName: dto.fullName,
        phone: dto.phone,
        role: UserRole.STUDENT,
        status: UserStatus.ACTIVE,
        studentProfile: { create: {} },
      },
      select: { userId: true, email: true, role: true, fullName: true },
    });
    return this.buildAuthResponse(user);
  }

  async registerCompany(dto: RegisterCompanyDto) {
    await this.ensureEmailAvailable(dto.email);
    const passwordHash = await argon2.hash(dto.password);
    const user = await this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email: dto.email.toLowerCase(),
          passwordHash,
          fullName: dto.fullName,
          phone: dto.phone,
          role: UserRole.COMPANY,
          status: UserStatus.ACTIVE,
          companyProfile: {
            create: { companyName: dto.companyName },
          },
        },
        include: { companyProfile: true },
      });
      if (created.companyProfile) {
        await tx.companyPostingQuota.create({
          data: {
            companyId: created.companyProfile.companyId,
            freePostLimit: 3,
          },
        });
        await tx.companyWallet.create({
          data: {
            companyId: created.companyProfile.companyId,
            balanceVnd: BigInt(0),
          },
        });
      }
      return created;
    });
    return this.buildAuthResponse({
      userId: user.userId,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
    });
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findFirst({
      where: { email: dto.email.toLowerCase(), deletedAt: null },
    });
    if (!user || user.status === UserStatus.BANNED) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }
    const valid = await argon2.verify(user.passwordHash, dto.password);
    if (!valid) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }
    await this.prisma.user.update({
      where: { userId: user.userId },
      data: { lastLoginAt: new Date() },
    });
    return this.buildAuthResponse({
      userId: user.userId,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
    });
  }

  async refresh(refreshToken: string | undefined) {
    if (!refreshToken) {
      throw new UnauthorizedException('Thiếu refresh token');
    }
    const tokenHash = this.hashToken(refreshToken);
    const stored = await this.prisma.refreshToken.findFirst({
      where: {
        tokenHash,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });
    if (!stored || stored.user.deletedAt) {
      throw new UnauthorizedException('Refresh token không hợp lệ');
    }
    await this.prisma.refreshToken.update({
      where: { refreshTokenId: stored.refreshTokenId },
      data: { revokedAt: new Date() },
    });
    return this.buildAuthResponse({
      userId: stored.user.userId,
      email: stored.user.email,
      role: stored.user.role,
      fullName: stored.user.fullName,
    });
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { userId: BigInt(userId), deletedAt: null },
      include: {
        studentProfile: true,
        companyProfile: { include: { postingQuota: true } },
        staffProfile: true,
      },
    });
    if (!user) {
      throw new UnauthorizedException('Người dùng không tồn tại');
    }
    return {
      id: user.userId.toString(),
      email: user.email,
      emailVerifiedAt: user.emailVerifiedAt?.toISOString() ?? null,
      fullName: user.fullName,
      phone: user.phone,
      role: user.role,
      status: user.status,
      avatarAssetId: user.avatarAssetId?.toString() ?? null,
      studentProfile: user.studentProfile,
      companyProfile: user.companyProfile
        ? {
            ...user.companyProfile,
            companyId: user.companyProfile.companyId.toString(),
            userId: user.companyProfile.userId.toString(),
            logoAssetId: user.companyProfile.logoAssetId?.toString() ?? null,
            verifiedBy: user.companyProfile.verifiedBy?.toString() ?? null,
            postingQuota: user.companyProfile.postingQuota
              ? {
                  ...user.companyProfile.postingQuota,
                  quotaId:
                    user.companyProfile.postingQuota.quotaId.toString(),
                  companyId:
                    user.companyProfile.postingQuota.companyId.toString(),
                }
              : null,
          }
        : null,
      staffProfile: user.staffProfile,
    };
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await this.prisma.user.findFirst({
      where: { userId: BigInt(userId), deletedAt: null },
    });
    if (!user) {
      throw new UnauthorizedException('Người dùng không tồn tại');
    }
    const valid = await argon2.verify(user.passwordHash, currentPassword);
    if (!valid) {
      throw new UnauthorizedException('Mật khẩu hiện tại không đúng');
    }
    const passwordHash = await argon2.hash(newPassword);
    await this.prisma.user.update({
      where: { userId: user.userId },
      data: { passwordHash },
    });
    await this.prisma.refreshToken.updateMany({
      where: { userId: user.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { success: true };
  }

  async sendEmailVerification(userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { userId: BigInt(userId), deletedAt: null },
    });
    if (!user) {
      throw new UnauthorizedException('Người dùng không tồn tại');
    }
    if (user.emailVerifiedAt) {
      return { success: true, alreadyVerified: true };
    }
    const token = await this.jwt.signAsync(
      { typ: 'email_verify', sub: user.userId.toString(), email: user.email },
      { expiresIn: '24h' },
    );
    const webUrl = this.config.get<string>('WEB_URL') ?? 'http://localhost:3000';
    const verifyUrl = `${webUrl.replace(/\/$/, '')}/xac-thuc-email?token=${encodeURIComponent(token)}`;
    // TODO: gửi email qua SMTP/Resend khi có cấu hình
    const sent = await this.mail.sendMail({
      to: user.email,
      subject: 'Xác thực email TalentHub',
      html: `<p>Xác thực tài khoản:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p>`,
      text: verifyUrl,
    });
    const devHint =
      !sent && this.config.get<string>('NODE_ENV') !== 'production'
        ? { verifyUrl }
        : {};
    return {
      success: true,
      message: sent
        ? 'Đã gửi email xác thực'
        : 'Liên kết xác thực (dev: xem verifyUrl)',
      ...devHint,
    };
  }

  async verifyEmail(token: string) {
    let payload: { typ?: string; sub?: string };
    try {
      payload = await this.jwt.verifyAsync<{ typ?: string; sub?: string }>(
        token,
      );
    } catch {
      throw new BadRequestException('Token xác thực không hợp lệ hoặc đã hết hạn');
    }
    if (payload.typ !== 'email_verify' || !payload.sub) {
      throw new BadRequestException('Token xác thực không hợp lệ');
    }
    await this.prisma.user.update({
      where: { userId: BigInt(payload.sub) },
      data: { emailVerifiedAt: new Date() },
    });
    return { success: true };
  }

  async logout(refreshToken: string | undefined) {
    if (!refreshToken) return { success: true };
    const tokenHash = this.hashToken(refreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { success: true };
  }

  private async ensureEmailAvailable(email: string) {
    const exists = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (exists) {
      throw new ConflictException('Email đã được sử dụng');
    }
  }

  private async buildAuthResponse(user: {
    userId: bigint;
    email: string;
    role: UserRole;
    fullName: string;
  }) {
    const payload = {
      sub: user.userId.toString(),
      email: user.email,
      role: user.role,
    };
    const accessToken = await this.jwt.signAsync(payload);
    const refreshToken = randomBytes(48).toString('hex');
    const expiresIn = this.config.get<string>('JWT_REFRESH_EXPIRES_IN', '7d');
    const expiresAt = this.addDuration(new Date(), expiresIn);
    await this.prisma.refreshToken.create({
      data: {
        userId: user.userId,
        tokenHash: this.hashToken(refreshToken),
        expiresAt,
      },
    });
    return {
      accessToken,
      refreshToken,
      user: {
        id: user.userId.toString(),
        email: user.email,
        role: user.role,
        fullName: user.fullName,
      },
    };
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private addDuration(from: Date, duration: string): Date {
    const match = /^(\d+)([smhd])$/.exec(duration);
    if (!match) {
      return new Date(from.getTime() + 7 * 24 * 60 * 60 * 1000);
    }
    const value = Number(match[1]);
    const unit = match[2];
    const ms =
      unit === 's'
        ? value * 1000
        : unit === 'm'
          ? value * 60_000
          : unit === 'h'
            ? value * 3_600_000
            : value * 86_400_000;
    return new Date(from.getTime() + ms);
  }
}
