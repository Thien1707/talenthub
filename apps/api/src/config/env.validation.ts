import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Min,
  validateSync,
} from 'class-validator';

enum NodeEnv {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

export class EnvironmentVariables {
  @IsEnum(NodeEnv)
  NODE_ENV: NodeEnv = NodeEnv.Development;

  @IsNumber()
  @Min(1)
  PORT: number = 4000;

  @IsString()
  @IsNotEmpty()
  DATABASE_URL: string;

  @IsUrl({ require_tld: false })
  WEB_URL: string = 'http://localhost:3000';

  @IsUrl({ require_tld: false })
  API_URL: string = 'http://localhost:4000';

  /** Thêm origin FE (phân tách dấu phẩy), vd URL preview Vercel */
  @IsOptional()
  @IsString()
  CORS_ORIGINS?: string;

  /** true → cho phép mọi https://*.vercel.app (preview deploy) */
  @IsOptional()
  @IsString()
  CORS_ALLOW_VERCEL?: string;

  @IsString()
  @IsNotEmpty()
  JWT_ACCESS_SECRET: string;

  @IsString()
  @IsNotEmpty()
  JWT_REFRESH_SECRET: string;

  @IsString()
  JWT_ACCESS_EXPIRES_IN: string = '15m';

  @IsString()
  JWT_REFRESH_EXPIRES_IN: string = '7d';

  @IsOptional()
  @IsString()
  CLOUDINARY_CLOUD_NAME?: string;

  @IsOptional()
  @IsString()
  CLOUDINARY_API_KEY?: string;

  @IsOptional()
  @IsString()
  CLOUDINARY_API_SECRET?: string;

  @IsOptional()
  @IsString()
  GEMINI_API_KEY?: string;

  @IsOptional()
  @IsString()
  GEMINI_MODEL?: string;

  @IsOptional()
  @IsString()
  VNPAY_TMN_CODE?: string;

  @IsOptional()
  @IsString()
  VNPAY_HASH_SECRET?: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  VNPAY_URL?: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  VNPAY_RETURN_URL?: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  VNPAY_IPN_URL?: string;

  @IsOptional()
  @IsString()
  SUPER_ADMIN_EMAIL?: string;

  @IsOptional()
  @IsString()
  SUPER_ADMIN_PASSWORD?: string;

  @IsOptional()
  @IsString()
  SMTP_HOST?: string;

  @IsOptional()
  @IsString()
  SMTP_PORT?: string;

  @IsOptional()
  @IsString()
  SMTP_USER?: string;

  @IsOptional()
  @IsString()
  SMTP_PASS?: string;

  @IsOptional()
  @IsString()
  SMTP_FROM?: string;

  @IsOptional()
  @IsString()
  STAFF_SEED_EMAIL?: string;

  @IsOptional()
  @IsString()
  STAFF_SEED_PASSWORD?: string;
}

export function validateEnv(config: Record<string, unknown>) {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validated, { skipMissingProperties: false });
  if (errors.length > 0) {
    throw new Error(
      `Cấu hình môi trường không hợp lệ:\n${errors
        .map((e) => Object.values(e.constraints ?? {}).join(', '))
        .join('\n')}`,
    );
  }
  return validated;
}
