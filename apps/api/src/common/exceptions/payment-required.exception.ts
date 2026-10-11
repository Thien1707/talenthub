import { HttpException, HttpStatus } from '@nestjs/common';

export class PaymentRequiredException extends HttpException {
  constructor(payload: {
    jobId: string;
    jobType: string;
    message?: string;
  }) {
    super(
      {
        code: 'PAYMENT_REQUIRED',
        message:
          payload.message ??
          'Cần thanh toán trước khi gửi tin duyệt. Tạo đơn hàng và thanh toán VNPAY.',
        jobId: payload.jobId,
        jobType: payload.jobType,
      },
      HttpStatus.PAYMENT_REQUIRED,
    );
  }
}
