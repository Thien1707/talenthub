import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Response } from 'express';

@Catch(
  Prisma.PrismaClientKnownRequestError,
  Prisma.PrismaClientUnknownRequestError,
)
export class PrismaClientExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaClientExceptionFilter.name);

  catch(
    exception:
      | Prisma.PrismaClientKnownRequestError
      | Prisma.PrismaClientUnknownRequestError,
    host: ArgumentsHost,
  ) {
    if (
      exception instanceof Prisma.PrismaClientUnknownRequestError &&
      exception.message.includes("item_type")
    ) {
      this.logger.error(exception.message);
      const response = host.switchToHttp().getResponse<Response>();
      response.status(HttpStatus.SERVICE_UNAVAILABLE).json({
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        code: 'DB_SCHEMA_OUTDATED',
        message:
          'Cơ sở dữ liệu thiếu loại đơn WALLET_TOPUP. Chạy: npx prisma migrate deploy (trong apps/api).',
      });
      return;
    }

    if (!(exception instanceof Prisma.PrismaClientKnownRequestError)) {
      this.logger.error(exception.message);
      const response = host.switchToHttp().getResponse<Response>();
      response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Lỗi cơ sở dữ liệu. Vui lòng thử lại sau.',
      });
      return;
    }
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception.code === 'P2020') {
      response.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        message:
          'Mức lương vượt giới hạn cho phép. Nhập số VND (ví dụ 15,000,000 – 30,000,000), tối đa 999,999,999,999 VND.',
      });
      return;
    }

    if (exception.code === 'P2003') {
      response.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Dữ liệu không hợp lệ (danh mục hoặc tham chiếu không tồn tại).',
      });
      return;
    }

    if (exception.code === 'P2022' || exception.code === 'P2021') {
      this.logger.error(exception.message);
      response.status(HttpStatus.SERVICE_UNAVAILABLE).json({
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        code: 'DB_SCHEMA_OUTDATED',
        message:
          'Cơ sở dữ liệu chưa đồng bộ với phiên bản API. Quản trị viên cần chạy: npx prisma migrate deploy (trong apps/api).',
      });
      return;
    }

    this.logger.error(exception.message);
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Lỗi cơ sở dữ liệu. Vui lòng thử lại sau.',
    });
  }
}
