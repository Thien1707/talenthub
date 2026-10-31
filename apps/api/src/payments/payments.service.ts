import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { getCompanyProfileForUser } from '../common/utils/company-access.util';
import { OrdersService } from '../orders/orders.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  flattenVnpQuery,
  isVnpPaymentSuccessful,
} from './vnp-query.util';
import {
  buildVnpayPaymentUrl,
  isPublicHttpsUrl,
  normalizeVnpIpAddr,
  verifyVnpSignature,
  vnpCreateAndExpireDates,
} from './vnpay.util';

const MIN_VNPAY_VND = 5_000;

export type VnpayCallbackResult = {
  success: boolean;
  message: string;
  walletCredited?: boolean;
  alreadyProcessed?: boolean;
  vnpTxnRef?: string;
  orderId?: string;
  amountVnd?: number;
  isIpn?: boolean;
};

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
  const webUrl = config.get<string>('WEB_URL') ?? 'http://localhost:3000';
  return { tmnCode, hashSecret, vnpUrl, returnUrl, ipnUrl, webUrl };
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

  getWebReturnUrl(): string {
    return readVnpConfig(this.config).webUrl;
  }

  async handleVnpayReturn(rawQuery: Record<string, unknown>) {
    return this.processVnpayCallback(flattenVnpQuery(rawQuery), 'RETURN');
  }

  async handleVnpayCompleteReturn(rawQuery: Record<string, unknown>) {
    return this.processVnpayCallback(flattenVnpQuery(rawQuery), 'RETURN_API');
  }

  async handleVnpayIpn(rawQuery: Record<string, unknown>) {
    const result = await this.processVnpayCallback(
      flattenVnpQuery(rawQuery),
      'IPN',
    );
    return {
      RspCode: result.success ? '00' : '97',
      Message: result.success ? 'Confirm Success' : result.message,
    };
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

  async getWalletTopUpStatusByTxnRef(userId: bigint, vnpTxnRef: string) {
    const company = await getCompanyProfileForUser(this.prisma, userId);
    const payment = await this.prisma.paymentTransaction.findFirst({
      where: {
        vnpTxnRef,
        order: { companyId: company.companyId },
      },
      include: { order: true },
    });
    if (!payment) throw new NotFoundException('Không tìm thấy giao dịch thanh toán');
    const wallet = await this.prisma.companyWallet.findUnique({
      where: { companyId: company.companyId },
    });
    return {
      paymentStatus: payment.status,
      orderStatus: payment.order.status,
      vnpTxnRef,
      amountVnd: Math.round(Number(payment.amount)),
      walletBalanceVnd: wallet?.balanceVnd.toString() ?? '0',
      walletCredited: payment.order.status === OrderStatus.PAID,
    };
  }

  private async processVnpayCallback(
    query: Record<string, string>,
    source: 'RETURN' | 'RETURN_API' | 'IPN',
  ): Promise<VnpayCallbackResult> {
    const vnpTxnRef = query['vnp_TxnRef'];
    const responseCode = query['vnp_ResponseCode'];
    const txnStatus = query['vnp_TransactionStatus'];

    this.logger.log(
      `VNPAY callback source=${source} txnRef=${vnpTxnRef ?? '-'} responseCode=${responseCode ?? '-'} txnStatus=${txnStatus ?? '-'}`,
    );

    const hashSecret = readVnpConfig(this.config).hashSecret;
    if (!hashSecret) {
      this.logger.error('VNPAY callback: missing hash secret config');
      return { success: false, message: 'Missing VNPAY config', isIpn: source === 'IPN' };
    }

    const secureHash = query['vnp_SecureHash'];
    const signatureOk =
      !!secureHash && verifyVnpSignature(query, secureHash, hashSecret);
    this.logger.log(
      `VNPAY callback txnRef=${vnpTxnRef ?? '-'} signatureValid=${signatureOk}`,
    );
    if (!signatureOk) {
      return { success: false, message: 'Invalid signature', vnpTxnRef, isIpn: source === 'IPN' };
    }

    if (!vnpTxnRef) {
      return { success: false, message: 'Missing vnp_TxnRef', isIpn: source === 'IPN' };
    }

    const payment = await this.prisma.paymentTransaction.findUnique({
      where: { vnpTxnRef },
      include: { order: true },
    });
    if (!payment) {
      this.logger.warn(`VNPAY callback: payment not found txnRef=${vnpTxnRef}`);
      return { success: false, message: 'Payment not found', vnpTxnRef, isIpn: source === 'IPN' };
    }

    const amountVnd = Math.round(Number(payment.amount));
    const vnpAmount = Number(query['vnp_Amount'] ?? 0);
    const expectedAmount = amountVnd * 100;

    if (vnpAmount !== expectedAmount) {
      this.logger.warn(
        `VNPAY amount mismatch txnRef=${vnpTxnRef} expected=${expectedAmount} got=${vnpAmount}`,
      );
      await this.markPaymentFailed(payment.paymentId, query, 'Amount mismatch');
      return {
        success: false,
        message: 'Invalid amount',
        vnpTxnRef,
        amountVnd,
        isIpn: source === 'IPN',
      };
    }

    if (payment.status === PaymentStatus.SUCCESS) {
      const walletCredited = await this.ensureOrderFulfilled(payment.orderId);
      this.logger.log(
        `VNPAY callback already SUCCESS txnRef=${vnpTxnRef} walletReconciled=${walletCredited}`,
      );
      return {
        success: true,
        message: 'Already processed',
        alreadyProcessed: true,
        walletCredited,
        vnpTxnRef,
        orderId: payment.orderId.toString(),
        amountVnd,
        isIpn: source === 'IPN',
      };
    }

    if (!isVnpPaymentSuccessful(query)) {
      await this.markPaymentFailed(
        payment.paymentId,
        query,
        `Code ${responseCode ?? 'unknown'}`,
      );
      this.logger.log(
        `VNPAY payment failed txnRef=${vnpTxnRef} responseCode=${responseCode}`,
      );
      return {
        success: false,
        message: 'Payment failed',
        vnpTxnRef,
        amountVnd,
        isIpn: source === 'IPN',
      };
    }

    const walletBefore = await this.readWalletBalance(payment.order.companyId);
    this.logger.log(
      `VNPAY crediting wallet txnRef=${vnpTxnRef} companyId=${payment.order.companyId} balanceBefore=${walletBefore}`,
    );

    const claimed = await this.claimPaymentSuccess(payment.paymentId, query);
    if (!claimed) {
      const walletCredited = await this.ensureOrderFulfilled(payment.orderId);
      return {
        success: true,
        message: 'Already processed',
        alreadyProcessed: true,
        walletCredited,
        vnpTxnRef,
        orderId: payment.orderId.toString(),
        amountVnd,
        isIpn: source === 'IPN',
      };
    }

    const walletCredited = await this.ensureOrderFulfilled(payment.orderId);
    const walletAfter = await this.readWalletBalance(payment.order.companyId);

    this.logger.log(
      `VNPAY wallet credit txnRef=${vnpTxnRef} credited=${walletCredited} balanceBefore=${walletBefore} balanceAfter=${walletAfter}`,
    );

    return {
      success: true,
      message: 'OK',
      walletCredited,
      vnpTxnRef,
      orderId: payment.orderId.toString(),
      amountVnd,
      isIpn: source === 'IPN',
    };
  }

  /** Chỉ một luồng callback chuyển payment sang SUCCESS. */
  private async claimPaymentSuccess(
    paymentId: bigint,
    query: Record<string, string>,
  ): Promise<boolean> {
    const updated = await this.prisma.paymentTransaction.updateMany({
      where: {
        paymentId,
        status: { in: [PaymentStatus.PENDING, PaymentStatus.INITIATED] },
      },
      data: {
        status: PaymentStatus.SUCCESS,
        responseCode: query['vnp_ResponseCode'],
        responseMessage: query['vnp_Message'] ?? 'Success',
        providerTransactionNo: query['vnp_TransactionNo'],
        responseData: query,
        verifiedAt: new Date(),
        paidAt: new Date(),
      },
    });
    return updated.count > 0;
  }

  /** Cộng ví / hoàn tất đơn nếu chưa PAID (idempotent). */
  private async ensureOrderFulfilled(orderId: bigint): Promise<boolean> {
    const before = await this.prisma.order.findUnique({
      where: { orderId },
      select: { status: true },
    });
    if (before?.status === OrderStatus.PAID) {
      return true;
    }
    const order = await this.ordersService.fulfillPaidOrder(orderId);
    return order?.status === OrderStatus.PAID;
  }

  private async readWalletBalance(companyId: bigint): Promise<string> {
    const w = await this.prisma.companyWallet.findUnique({
      where: { companyId },
    });
    return w?.balanceVnd.toString() ?? '0';
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
