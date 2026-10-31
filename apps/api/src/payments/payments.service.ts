import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { randomBytes } from 'crypto';
import { getCompanyProfileForUser } from '../common/utils/company-access.util';
import { OrdersService } from '../orders/orders.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  buildVnpayPaymentUrl,
  isPublicHttpsUrl,
  normalizeVnpIpAddr,
  verifyVnpSignature,
  vnpCreateAndExpireDates,
} from './vnpay.util';

const MIN_VNPAY_VND = 5_000;

function readVnpConfig(config: ConfigService) {
  const tmnCode = (
    config.get<string>('VNPAY_TMN_CODE') ?? config.get<string>('VNP_TMN_CODE')
  )?.trim();
  const hashSecret = (
    config.get<string>('VNPAY_HASH_SECRET') ??
    config.get<string>('VNP_HASH_SECRET')
  )?.trim();
  const vnpUrl =
    config.get<string>('VNPAY_URL') ?? config.get<string>('VNP_URL');
  const returnUrl =
    config.get<string>('VNPAY_RETURN_URL') ??
    config.get<string>('VNP_RETURN_URL');
  const ipnUrl =
    config.get<string>('VNPAY_IPN_URL') ?? config.get<string>('VNP_IPN_URL');
  return { tmnCode, hashSecret, vnpUrl, returnUrl, ipnUrl };
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly ordersService: OrdersService,
  ) {}

  async createVnpayPayment(
    userId: bigint,
    orderId: bigint,
    ipAddr = '127.0.0.1',
  ) {
    const company = await getCompanyProfileForUser(this.prisma, userId);
    const order = await this.prisma.order.findFirst({
      where: { orderId, companyId: company.companyId },
    });
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');
    if (order.status === OrderStatus.PAID) {
      throw new BadRequestException('Đơn hàng đã thanh toán');
    }

    const { tmnCode, hashSecret, vnpUrl, returnUrl, ipnUrl } = readVnpConfig(
      this.config,
    );
    if (!tmnCode || !hashSecret || !vnpUrl || !returnUrl) {
      throw new BadRequestException(
        'Chưa cấu hình VNPAY (VNPAY_TMN_CODE, VNPAY_HASH_SECRET, VNPAY_URL, VNPAY_RETURN_URL).',
      );
    }

    const amountVnd = Math.round(Number(order.totalAmount));
    if (!Number.isInteger(amountVnd) || amountVnd < MIN_VNPAY_VND) {
      throw new BadRequestException(
        `Số tiền thanh toán tối thiểu ${MIN_VNPAY_VND.toLocaleString('en-US')} VND`,
      );
    }

    const vnpTxnRef = `TH${order.orderId}-${Date.now().toString(36)}`.slice(
      0,
      100,
    );
    const vnpAmount = amountVnd * 100;
    const { createDate, expireDate } = vnpCreateAndExpireDates();
    const clientIp = normalizeVnpIpAddr(ipAddr);

    const payment = await this.prisma.paymentTransaction.create({
      data: {
        orderId: order.orderId,
        vnpTxnRef,
        amount: order.totalAmount,
        currency: order.currency,
        status: PaymentStatus.INITIATED,
        requestData: { vnpAmount, amountVnd, orderCode: order.orderCode },
      },
    });

    const params: Record<string, string | number> = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: tmnCode,
      vnp_Amount: vnpAmount,
      vnp_CurrCode: 'VND',
      vnp_TxnRef: vnpTxnRef,
      vnp_OrderInfo: `Nap vi ${order.orderCode}`.slice(0, 255),
      vnp_OrderType: 'other',
      vnp_Locale: 'vn',
      vnp_ReturnUrl: returnUrl.trim(),
      vnp_IpAddr: clientIp,
      vnp_CreateDate: createDate,
      vnp_ExpireDate: expireDate,
    };
    const ipn = ipnUrl?.trim();
    if (ipn && isPublicHttpsUrl(ipn)) {
      params.vnp_IpNUrl = ipn;
    }

    const paymentUrl = buildVnpayPaymentUrl(vnpUrl, params, hashSecret);
    this.logger.log(
      `VNPAY init order=${order.orderCode} txnRef=${vnpTxnRef} amountVnd=${amountVnd} vnpAmount=${vnpAmount} ip=${clientIp}`,
    );

    await this.prisma.paymentTransaction.update({
      where: { paymentId: payment.paymentId },
      data: { status: PaymentStatus.PENDING },
    });

    return {
      paymentId: payment.paymentId.toString(),
      paymentUrl,
      vnpTxnRef,
    };
  }

  async handleVnpayReturn(query: Record<string, string>) {
    return this.processVnpayCallback(query, false);
  }

  async handleVnpayIpn(query: Record<string, string>) {
    const result = await this.processVnpayCallback(query, true);
    return { RspCode: result.success ? '00' : '97', Message: result.message };
  }

  async getPayment(userId: bigint, paymentId: bigint) {
    const company = await getCompanyProfileForUser(this.prisma, userId);
    const payment = await this.prisma.paymentTransaction.findFirst({
      where: {
        paymentId,
        order: { companyId: company.companyId },
      },
      include: { order: { include: { items: true } } },
    });
    if (!payment) throw new NotFoundException('Không tìm thấy giao dịch');
    return payment;
  }

  private async processVnpayCallback(
    query: Record<string, string>,
    isIpn: boolean,
  ) {
    const hashSecret = readVnpConfig(this.config).hashSecret;
    if (!hashSecret) {
      return { success: false, message: 'Missing VNPAY config' };
    }

    const secureHash = query['vnp_SecureHash'];
    if (!secureHash || !verifyVnpSignature(query, secureHash, hashSecret)) {
      return { success: false, message: 'Invalid signature' };
    }

    const vnpTxnRef = query['vnp_TxnRef'];
    const responseCode = query['vnp_ResponseCode'];
    const vnpAmount = Number(query['vnp_Amount'] ?? 0);

    const payment = await this.prisma.paymentTransaction.findUnique({
      where: { vnpTxnRef },
      include: { order: true },
    });
    if (!payment) {
      return { success: false, message: 'Payment not found' };
    }

    if (payment.status === PaymentStatus.SUCCESS) {
      return { success: true, message: 'Already processed', payment, isIpn };
    }

    const expectedAmount = Math.round(Number(payment.amount) * 100);
    if (vnpAmount !== expectedAmount) {
      await this.markPaymentFailed(payment.paymentId, query, 'Amount mismatch');
      return { success: false, message: 'Invalid amount', payment, isIpn };
    }

    if (responseCode === '00') {
      await this.prisma.$transaction(async (tx) => {
        await tx.paymentTransaction.update({
          where: { paymentId: payment.paymentId },
          data: {
            status: PaymentStatus.SUCCESS,
            responseCode,
            responseMessage: query['vnp_Message'] ?? 'Success',
            providerTransactionNo: query['vnp_TransactionNo'],
            responseData: query,
            verifiedAt: new Date(),
            paidAt: new Date(),
          },
        });
      });
      await this.ordersService.fulfillPaidOrder(payment.orderId);
      const updated = await this.prisma.paymentTransaction.findUnique({
        where: { paymentId: payment.paymentId },
        include: { order: true },
      });
      return { success: true, message: 'OK', payment: updated, isIpn };
    }

    await this.markPaymentFailed(
      payment.paymentId,
      query,
      `Code ${responseCode}`,
    );
    return { success: false, message: 'Payment failed', isIpn };
  }

  private async markPaymentFailed(
    paymentId: bigint,
    query: Record<string, string>,
    message: string,
  ) {
    await this.prisma.paymentTransaction.update({
      where: { paymentId },
      data: {
        status: PaymentStatus.FAILED,
        responseCode: query['vnp_ResponseCode'],
        responseMessage: message,
        responseData: query,
        verifiedAt: new Date(),
      },
    });
  }
}

