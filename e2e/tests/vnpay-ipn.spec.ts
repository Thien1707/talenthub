import { createHmac } from "crypto";
import { test, expect } from "@playwright/test";

function sortVnpParams(
  params: Record<string, string | number>,
): Record<string, string> {
  const sorted: Record<string, string> = {};
  Object.keys(params)
    .sort()
    .forEach((key) => {
      sorted[key] = String(params[key]);
    });
  return sorted;
}

function signVnpParams(params: Record<string, string>, secret: string) {
  const signData = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return createHmac("sha512", secret).update(signData).digest("hex");
}

/**
 * Gọi IPN với chữ ký sandbox-style. Cần payment PENDING tồn tại trong DB
 * (tạo qua flow công ty) — set E2E_VNP_TXN_REF + VNPAY_HASH_SECRET.
 */
test("VNPAY IPN endpoint chấp nhận chữ ký hợp lệ", async ({ request }) => {
  const apiBase =
    process.env.API_URL?.replace(/\/$/, "") ?? "http://localhost:4000";
  const secret = process.env.VNPAY_HASH_SECRET;
  const txnRef = process.env.E2E_VNP_TXN_REF;
  test.skip(!secret || !txnRef, "Thiếu VNPAY_HASH_SECRET hoặc E2E_VNP_TXN_REF");

  const params = sortVnpParams({
    vnp_Amount: process.env.E2E_VNP_AMOUNT ?? "15000000",
    vnp_ResponseCode: "00",
    vnp_TxnRef: txnRef!,
    vnp_TransactionNo: "99988877",
    vnp_OrderInfo: "E2E IPN test",
  });
  const vnp_SecureHash = signVnpParams(params, secret!);
  const qs = new URLSearchParams({ ...params, vnp_SecureHash });

  const first = await request.post(
    `${apiBase}/api/v1/payments/vnpay/ipn?${qs.toString()}`,
  );
  expect(first.ok()).toBeTruthy();
  const body1 = await first.json();
  expect(body1.RspCode).toBe("00");

  const second = await request.post(
    `${apiBase}/api/v1/payments/vnpay/ipn?${qs.toString()}`,
  );
  const body2 = await second.json();
  expect(body2.RspCode).toBe("00");
});
