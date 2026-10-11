"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api/client";

type CompanyRow = {
  companyId: string;
  companyName: string;
  city?: string | null;
  user?: { email: string; fullName: string };
};

export function CompanyVerificationPanel() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "companies-pending"],
    queryFn: async () => {
      const { data } = await api.get<CompanyRow[]>(
        "/admin/companies/pending-verification",
      );
      return data;
    },
  });

  const verify = useMutation({
    mutationFn: ({
      companyId,
      status,
    }: {
      companyId: string;
      status: "VERIFIED" | "REJECTED";
    }) =>
      api.post(`/admin/companies/${companyId}/verify`, {
        status,
        note:
          status === "REJECTED"
            ? "Hồ sơ chưa đủ thông tin xác minh."
            : undefined,
      }),
    onSuccess: () => {
      toast.success("Đã cập nhật xác minh");
      void qc.invalidateQueries({ queryKey: ["admin", "companies-pending"] });
      void qc.invalidateQueries({ queryKey: ["admin", "staff-dashboard"] });
    },
  });

  if (isLoading) return <p className="text-slate-600">Đang tải...</p>;
  if (!data?.length) {
    return <p className="text-slate-600">Không có công ty chờ xác minh.</p>;
  }

  return (
    <ul className="space-y-3">
      {data.map((c) => (
        <li key={c.companyId} className="rounded-xl border bg-white p-4">
          <p className="font-semibold">{c.companyName}</p>
          <p className="text-sm text-slate-600">
            {c.user?.fullName} · {c.user?.email} · {c.city}
          </p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              className="rounded bg-emerald-600 px-3 py-1 text-sm text-white"
              onClick={() =>
                verify.mutate({ companyId: c.companyId, status: "VERIFIED" })
              }
            >
              Xác minh
            </button>
            <button
              type="button"
              className="rounded border border-red-400 px-3 py-1 text-sm text-red-700"
              onClick={() =>
                verify.mutate({ companyId: c.companyId, status: "REJECTED" })
              }
            >
              Từ chối
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
