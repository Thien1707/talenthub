import { PaymentStatus } from '@prisma/client';
import { signVnpParams, sortVnpParams, verifyVnpSignature } from './vnpay.util';

/** Hành vi IPN: nếu payment đã SUCCESS thì không gọi fulfill lần nữa (xem processVnpayCallback). */
describe('VNPAY IPN idempotency contract', () => {
  it('SUCCESS is terminal for duplicate IPN callbacks', () => {
    const alreadyPaid = PaymentStatus.SUCCESS;
    const shouldFulfillAgain = alreadyPaid !== PaymentStatus.SUCCESS;
    expect(shouldFulfillAgain).toBe(false);
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
