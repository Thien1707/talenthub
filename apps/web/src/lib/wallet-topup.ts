import { api } from "@/lib/api/client";
import { extractApiErrorMessage } from "@/lib/extract-api-error";

const VNPAY_HOSTS = ["sandbox.vnpayment.vn", "vnpayment.vn"];

export function isAllowedVnpayUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return VNPAY_HOSTS.some(
      (h) => u.hostname === h || u.hostname.endsWith(`.${h}`),
    );
  } catch {
    return false;
  }
}

export async function redirectToVnpayTopUp(amountVnd: number): Promise<void> {
  let orderId: string;
  try {
    const { data: order } = await api.post<{ orderId: string }>(
      "/wallet/top-up",
      { amountVnd },
    );
    if (!order?.orderId) {
      throw new Error("MISSING_ORDER_ID");
    }
    orderId = order.orderId;
  } catch (err: unknown) {
    throw new Error(
      extractApiErrorMessage(err, "Không tạo được đơn nạp ví"),
    );
  }

  let paymentUrl: string;
  try {
    const { data: payment } = await api.post<{ paymentUrl: string }>(
      "/payments/vnpay/create",
      { orderId },
    );
    paymentUrl = payment?.paymentUrl ?? "";
  } catch (err: unknown) {
    throw new Error(
      extractApiErrorMessage(
        err,
        "Không khởi tạo được thanh toán VNPAY — kiểm tra cấu hình VNPAY trên server",
      ),
    );
  }

  if (!paymentUrl || !isAllowedVnpayUrl(paymentUrl)) {
    throw new Error("URL thanh toán VNPAY không hợp lệ");
  }

  window.location.assign(paymentUrl);
}
