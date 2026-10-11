import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { UserStatus } from '@prisma/client';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthUserPayload } from '../../common/decorators/current-user.decorator';

type JwtPayload = {
  sub: string;
  email: string;
  role: string;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_ACCESS_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<AuthUserPayload> {
    const user = await this.prisma.user.findFirst({
      where: {
        userId: BigInt(payload.sub),
        deletedAt: null,
        status: { in: [UserStatus.ACTIVE, UserStatus.PENDING] },
      },
    });
    if (!user) {
      throw new UnauthorizedException('Phiên đăng nhập không hợp lệ');
    }
    return {
      userId: user.userId.toString(),
      email: user.email,
      role: user.role,
    };
  }
}
