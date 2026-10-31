type ApiErr = {
  response?: {
    status?: number;
    data?: {
      message?: string | string[];
      code?: string;
    };
  };
};

export function extractApiErrorMessage(err: unknown, fallback: string): string {
  const res = (err as ApiErr)?.response;
  const msg = res?.data?.message;
  if (Array.isArray(msg)) return msg.join(". ");
  if (typeof msg === "string" && msg.length) return msg;
  if (res?.data?.code === "DB_SCHEMA_OUTDATED") {
    return "Hệ thống chưa cập nhật cơ sở dữ liệu (migration). Liên hệ quản trị hoặc chạy prisma migrate deploy.";
  }
  if (res?.status === 503) {
    return "Dịch vụ tạm thời không khả dụng — kiểm tra API và migration DB.";
  }
  return fallback;
}
