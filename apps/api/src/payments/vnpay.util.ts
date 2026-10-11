import * as crypto from 'crypto';

export function sortVnpParams(
  params: Record<string, string | number | undefined | null>,
): Record<string, string> {
  const sorted: Record<string, string> = {};
  Object.keys(params)
    .sort()
    .forEach((key) => {
      const val = params[key];
      if (val === undefined || val === null || val === '') return;
      sorted[key] = String(val);
    });
  return sorted;
}

export function signVnpParams(
  params: Record<string, string>,
  hashSecret: string,
): string {
  const signData = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&');
  return crypto.createHmac('sha512', hashSecret).update(signData).digest('hex');
}

export function verifyVnpSignature(
  params: Record<string, string>,
  secureHash: string,
  hashSecret: string,
): boolean {
  const clone = { ...params };
  delete clone['vnp_SecureHash'];
  delete clone['vnp_SecureHashType'];
  const signed = signVnpParams(sortVnpParams(clone), hashSecret);
  return signed === secureHash;
}
