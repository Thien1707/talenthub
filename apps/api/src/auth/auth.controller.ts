import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterCompanyDto } from './dto/register-company.dto';
import { RegisterStudentDto } from './dto/register-student.dto';

const REFRESH_COOKIE = 'talenthub_refresh';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Thông tin phiên đăng nhập hiện tại' })
  me(@CurrentUser() user: { userId: string }) {
    return this.authService.getMe(user.userId);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(200)
  @ApiOperation({ summary: 'Đổi mật khẩu' })
  changePassword(
    @CurrentUser() user: { userId: string },
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(
      user.userId,
      dto.currentPassword,
      dto.newPassword,
    );
  }

  @Post('verify-email/send')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(200)
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @ApiOperation({ summary: 'Gửi / tạo liên kết xác thực email' })
  sendVerifyEmail(@CurrentUser() user: { userId: string }) {
    return this.authService.sendEmailVerification(user.userId);
  }

  @Post('verify-email')
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Xác thực email bằng token' })
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto.token);
  }

  @Post('register/student')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Đăng ký tài khoản sinh viên' })
  async registerStudent(
    @Body() dto: RegisterStudentDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.registerStudent(dto);
    this.setRefreshCookie(res, result.refreshToken);
    return this.publicAuthBody(result);
  }

  @Post('register/company')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Đăng ký tài khoản công ty' })
  async registerCompany(
    @Body() dto: RegisterCompanyDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.registerCompany(dto);
    this.setRefreshCookie(res, result.refreshToken);
    return this.publicAuthBody(result);
  }

  @Post('login')
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Đăng nhập' })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(dto);
    this.setRefreshCookie(res, result.refreshToken);
    return this.publicAuthBody(result);
  }

  @Post('refresh')
  @HttpCode(200)
  @ApiOperation({ summary: 'Làm mới access token' })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    const result = await this.authService.refresh(token);
    this.setRefreshCookie(res, result.refreshToken);
    return this.publicAuthBody(result);
  }

  @Post('logout')
  @HttpCode(200)
  @ApiOperation({ summary: 'Đăng xuất' })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    await this.authService.logout(token);
    res.clearCookie(REFRESH_COOKIE, { path: '/api/v1/auth' });
    return { success: true };
  }

  private publicAuthBody(result: {
    accessToken: string;
    refreshToken: string;
    user: unknown;
  }) {
    return { accessToken: result.accessToken, user: result.user };
  }

  private setRefreshCookie(res: Response, refreshToken: string) {
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie(REFRESH_COOKIE, refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'strict' : 'lax',
      path: '/api/v1/auth',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }
}
