import {
  buildVnpSignData,
  buildVnpayPaymentUrl,
  encodeVnpValue,
  normalizeVnpIpAddr,
  signVnpParams,
  sortVnpParams,
  verifyVnpSignature,
} from './vnpay.util';

describe('vnpay.util', () => {
  const secret = 'sandbox_test_secret';

  it('encodeVnpValue uses + for spaces', () => {
    expect(encodeVnpValue('Nap vi don hang')).toBe('Nap+vi+don+hang');
  });

  it('encodes ReturnUrl in sign data (root cause of code 70 when raw)', () => {
    const params = sortVnpParams({
      vnp_ReturnUrl: 'http://localhost:3000/thanh-toan/ket-qua',
      vnp_Amount: '10000000',
      vnp_TmnCode: 'FZAI8WCL',
    });
    const signData = buildVnpSignData(params);
    expect(signData).toContain(
      'vnp_ReturnUrl=http%3A%2F%2Flocalhost%3A3000%2Fthanh-toan%2Fket-qua',
    );
    expect(signData).not.toContain('vnp_ReturnUrl=http://');
  });

  it('buildVnpayPaymentUrl: sign string in URL matches HMAC input', () => {
    const params = sortVnpParams({
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: 'TEST',
      vnp_Amount: '10000000',
      vnp_CurrCode: 'VND',
      vnp_TxnRef: 'TH1-abc',
      vnp_OrderInfo: 'Nap vi TH-WALLET',
      vnp_OrderType: 'other',
      vnp_Locale: 'vn',
      vnp_ReturnUrl: 'http://localhost:3000/thanh-toan/ket-qua',
      vnp_IpAddr: '127.0.0.1',
      vnp_CreateDate: '20261029193826',
      vnp_ExpireDate: '20261029195326',
    });
    const signData = buildVnpSignData(params);
    const hash = signVnpParams(params, secret);
    const url = buildVnpayPaymentUrl(
      'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
      {
        vnp_Version: '2.1.0',
        vnp_Command: 'pay',
        vnp_TmnCode: 'TEST',
        vnp_Amount: 10_000_000,
        vnp_CurrCode: 'VND',
        vnp_TxnRef: 'TH1-abc',
        vnp_OrderInfo: 'Nap vi TH-WALLET',
        vnp_OrderType: 'other',
        vnp_Locale: 'vn',
        vnp_ReturnUrl: 'http://localhost:3000/thanh-toan/ket-qua',
        vnp_IpAddr: '127.0.0.1',
        vnp_CreateDate: '20261029193826',
        vnp_ExpireDate: '20261029195326',
      },
      secret,
    );
    expect(url).toBe(
      `https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?${signData}&vnp_SecureHash=${hash}`,
    );
  });

  it('verifyVnpSignature accepts IPN-style decoded params', () => {
    const raw = sortVnpParams({
      vnp_Amount: '10000000',
      vnp_ResponseCode: '00',
      vnp_TxnRef: 'TH1-abc',
      vnp_OrderInfo: 'Nap vi don',
    });
    const hash = signVnpParams(raw, secret);
    expect(
      verifyVnpSignature({ ...raw, vnp_SecureHash: hash }, hash, secret),
    ).toBe(true);
  });

  it('normalizeVnpIpAddr maps IPv6 localhost to 127.0.0.1', () => {
    expect(normalizeVnpIpAddr('::1')).toBe('127.0.0.1');
    expect(normalizeVnpIpAddr('::ffff:127.0.0.1')).toBe('127.0.0.1');
  });
});
