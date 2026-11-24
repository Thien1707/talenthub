"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api/client";

type StaffRow = {
  userId: string;
  email: string;
  fullName: string;
  status: string;
  staffProfile?: { employeeCode: string; department?: string | null };
};

export function StaffManager() {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    email: "",
    password: "",
    fullName: "",
    employeeCode: "",
    department: "",
    position: "",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "staff"],
    queryFn: async () => {
      const { data } = await api.get<StaffRow[]>("/admin/staff");
      return data;
    },
  });

  const nextEmployeeCode = useMemo(() => {
    if (!data) return "";
    const codes = data
      .map((staff) => staff.staffProfile?.employeeCode ?? "")
      .filter((code) => /^\d+$/.test(code))
      .map((code) => Number(code));
    const highest = codes.reduce(
      (max, code) => (code > max ? code : max),
      0,
    );
    return String(highest + 1).padStart(3, "0");
  }, [data]);

  useEffect(() => {
    if (nextEmployeeCode) {
      setForm((current) => ({ ...current, employeeCode: nextEmployeeCode }));
    }
  }, [nextEmployeeCode]);

  const create = useMutation({
    mutationFn: () => api.post("/admin/staff", form),
    onSuccess: () => {
      toast.success("Đã tạo Staff");
      void qc.invalidateQueries({ queryKey: ["admin", "staff"] });
    },
    onError: () => toast.error("Tạo Staff thất bại"),
  });

  const toggle = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      api.post(`/admin/staff/${id}/${active ? "activate" : "suspend"}`),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin", "staff"] }),
  });

  return (
    <div className="admin-dark-surface space-y-8">
      <div className="rounded-xl border bg-white p-4">
        <h2 className="font-semibold">Tạo nhân viên Staff</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {(
            [
              ["email", "Email"],
              ["password", "Mật khẩu"],
              ["fullName", "Họ tên"],
              ["department", "Phòng ban"],
              ["position", "Chức vụ"],
            ] as const
          ).map(([key, label]) => (
            <input
              key={key}
              placeholder={label}
              className="rounded border px-2 py-1.5 text-sm"
              value={form[key]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
            />
          ))}
        </div>
        <label className="mt-3 block max-w-sm text-sm font-medium text-slate-700">
          Mã NV (tự động)
          <input
            className="mt-1 w-full rounded border bg-slate-100 px-2 py-1.5 text-sm text-slate-700"
            value={form.employeeCode}
            placeholder={isLoading ? "Đang lấy mã tiếp theo…" : "Chưa tạo được mã"}
            readOnly
            aria-readonly="true"
          />
        </label>
        <p className="mt-1 text-xs text-slate-500">
          Mã tiếp theo được tạo từ mã nhân viên hiện có.
        </p>
        <button
          type="button"
          className="mt-3 rounded bg-blue-700 px-3 py-2 text-sm text-white"
          onClick={() => create.mutate()}
          disabled={isLoading || !form.employeeCode || create.isPending}
        >
          {create.isPending ? "Đang tạo…" : "Tạo"}
        </button>
      </div>
      <ul className="space-y-2">
        {data?.map((s) => (
          <li key={s.userId} className="flex flex-wrap items-center justify-between rounded border bg-white p-3 text-sm">
            <span>
              {s.fullName} · {s.email} · {s.staffProfile?.employeeCode} ({s.status})
            </span>
            <button
              type="button"
              className="text-blue-700 hover:underline"
              onClick={() =>
                toggle.mutate({
                  id: s.userId,
                  active: s.status !== "ACTIVE",
                })
              }
            >
              {s.status === "ACTIVE" ? "Tạm khóa" : "Kích hoạt"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
