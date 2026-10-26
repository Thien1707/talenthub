/** Nhãn trạng thái tin tuyển dụng (đồng bộ enum Prisma JobStatus). */
export const JOB_STATUS_LABEL: Record<string, string> = {
  DRAFT: "Nháp",
  PENDING: "Chờ duyệt",
  APPROVED: "Đang tuyển",
  REJECTED: "Bị từ chối",
  PAUSED: "Tạm dừng",
  CLOSED: "Đã đóng",
  EXPIRED: "Hết hạn",
  REMOVED: "Đã gỡ",
};

export function jobStatusLabel(status: string) {
  return JOB_STATUS_LABEL[status] ?? status;
}

export function jobStatusBadgeClass(status: string) {
  switch (status) {
    case "APPROVED":
      return "bg-emerald-50 text-emerald-800 ring-emerald-200";
    case "PAUSED":
      return "bg-amber-50 text-amber-900 ring-amber-200";
    case "CLOSED":
      return "bg-slate-100 text-slate-700 ring-slate-200";
    case "PENDING":
      return "bg-blue-50 text-blue-800 ring-blue-200";
    case "REJECTED":
      return "bg-red-50 text-red-800 ring-red-200";
    case "DRAFT":
      return "bg-slate-50 text-slate-600 ring-slate-200";
    case "EXPIRED":
      return "bg-orange-50 text-orange-800 ring-orange-200";
    default:
      return "bg-slate-50 text-slate-600 ring-slate-200";
  }
}
