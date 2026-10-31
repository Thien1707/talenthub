import {
  flattenVnpQuery,
  isVnpPaymentSuccessful,
} from './vnp-query.util';

describe('vnp-query.util', () => {
  it('flattenVnpQuery keeps string params', () => {
    expect(flattenVnpQuery({ vnp_TxnRef: 'TH1', vnp_Amount: '10000000' })).toEqual({
      vnp_TxnRef: 'TH1',
      vnp_Amount: '10000000',
    });
  });

  it('isVnpPaymentSuccessful requires response code 00', () => {
    expect(isVnpPaymentSuccessful({ vnp_ResponseCode: '00' })).toBe(true);
    expect(isVnpPaymentSuccessful({ vnp_ResponseCode: '24' })).toBe(false);
    expect(
      isVnpPaymentSuccessful({
        vnp_ResponseCode: '00',
        vnp_TransactionStatus: '01',
      }),
    ).toBe(false);
  });
});
