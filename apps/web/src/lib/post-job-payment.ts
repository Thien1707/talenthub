import { api } from "@/lib/api/client";

/** Tạo đơn và chuyển hướng sang cổng VNPAY Sandbox. */
export async function redirectToVnpayForJob(jobId: string) {
  const { data: order } = await api.post<{ orderId: string }>("/orders/post-job", {
    jobId,
  });
  const { data: payment } = await api.post<{ paymentUrl: string }>(
    "/payments/vnpay/create",
    { orderId: order.orderId },
  );
  window.location.href = payment.paymentUrl;
}
