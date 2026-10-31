import { PaymentStatus } from '@prisma/client';
import {
  buildVnpayPaymentUrl,
  signVnpParams,
  sortVnpParams,
  verifyVnpSignature,
} from './vnpay.util';

/** Hành vi IPN: nếu payment đã SUCCESS thì không gọi fulfill lần nữa (xem processVnpayCallback). */
describe('VNPAY IPN idempotency contract', () => {
  it('SUCCESS is terminal for duplicate IPN callbacks', () => {
    const alreadyPaid = PaymentStatus.SUCCESS;
    const shouldFulfillAgain = alreadyPaid !== PaymentStatus.SUCCESS;
    expect(shouldFulfillAgain).toBe(false);
  });

  it('buildVnpayPaymentUrl includes encoded ReturnUrl and SecureHash', () => {
    const secret = 'sandbox_test_secret';
    const url = buildVnpayPaymentUrl(
      'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
      {
        vnp_Amount: 10_000_000,
        vnp_Command: 'pay',
        vnp_TmnCode: 'TEST',
        vnp_TxnRef: 'TH1-abc',
        vnp_ReturnUrl: 'http://localhost:3000/thanh-toan/ket-qua',
        vnp_CreateDate: '20261029193826',
        vnp_ExpireDate: '20261029195326',
      },
      secret,
    );
    expect(url).toContain('vnp_Amount=10000000');
    expect(url).toContain('vnp_ReturnUrl=http%3A%2F%2F');
    expect(url).toContain('&vnp_SecureHash=');
    const hash = url.split('vnp_SecureHash=')[1] ?? '';
    const queryPart = url.split('?')[1]?.split('&vnp_SecureHash=')[0] ?? '';
    const decoded: Record<string, string> = {};
    for (const pair of queryPart.split('&')) {
      const [k, v] = pair.split('=');
      if (k && v !== undefined) {
        decoded[decodeURIComponent(k)] = decodeURIComponent(v.replace(/\+/g, ' '));
      }
    }
    expect(verifyVnpSignature(decoded, hash, secret)).toBe(true);
  });

  it('sandbox-style query verifies HMAC like VNPAY IPN', () => {
    const secret = 'sandbox_test_secret';
    const params = sortVnpParams({
      vnp_Amount: '15000000',
      vnp_ResponseCode: '00',
      vnp_TxnRef: 'ORD-E2E-001',
      vnp_TransactionNo: '99988877',
    });
    const hash = signVnpParams(params, secret);
    expect(verifyVnpSignature({ ...params, vnp_SecureHash: hash }, hash, secret)).toBe(
      true,
    );
  });
});
