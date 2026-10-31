/** Chuẩn hoá query VNPAY từ Express (string | string[]). */
export function flattenVnpQuery(
  query: Record<string, unknown>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, val] of Object.entries(query)) {
    if (val === undefined || val === null) continue;
    if (Array.isArray(val)) {
      if (val[0] !== undefined && val[0] !== null) {
        out[key] = String(val[0]);
      }
    } else {
      out[key] = String(val);
    }
  }
  return out;
}

/** Điều kiện thành công theo tài liệu VNPAY PAY. */
export function isVnpPaymentSuccessful(query: Record<string, string>): boolean {
  if (query['vnp_ResponseCode'] !== '00') return false;
  const txnStatus = query['vnp_TransactionStatus'];
  if (txnStatus !== undefined && txnStatus !== '' && txnStatus !== '00') {
    return false;
  }
  return true;
}
