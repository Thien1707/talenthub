"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api/client";

type Expense = {
  expenseId: string;
  expenseCode: string;
  category: string;
  description: string;
  amount: string | number;
  status: string;
};

export function ExpenseWorkflow() {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    expenseCode: "",
    category: "",
    description: "",
    amount: "",
    expenseDate: new Date().toISOString().slice(0, 10),
    vendorName: "",
  });

  const { data } = useQuery({
    queryKey: ["admin", "expenses"],
    queryFn: async () => {
      const { data } = await api.get<Expense[]>("/admin/expenses");
      return data;
    },
  });

  const create = useMutation({
    mutationFn: () =>
      api.post("/admin/expenses", {
        ...form,
        amount: Number(form.amount),
      }),
    onSuccess: () => {
      toast.success("Đã tạo chi phí (DRAFT)");
      void qc.invalidateQueries({ queryKey: ["admin", "expenses"] });
    },
  });

  const action = useMutation({
    mutationFn: ({
      id,
      step,
    }: {
      id: string;
      step: "submit" | "approve" | "reject" | "mark-paid";
    }) => api.post(`/admin/expenses/${id}/${step}`, {}),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin", "expenses"] }),
  });

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-white p-4">
        <h2 className="font-semibold">Tạo chi phí</h2>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <input placeholder="Mã" className="rounded border px-2 py-1 text-sm" value={form.expenseCode} onChange={(e) => setForm({ ...form, expenseCode: e.target.value })} />
          <input placeholder="Nhóm" className="rounded border px-2 py-1 text-sm" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          <input placeholder="Số tiền" className="rounded border px-2 py-1 text-sm" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          <input type="date" className="rounded border px-2 py-1 text-sm" value={form.expenseDate} onChange={(e) => setForm({ ...form, expenseDate: e.target.value })} />
          <textarea placeholder="Mô tả" className="sm:col-span-2 rounded border px-2 py-1 text-sm" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <button type="button" className="mt-2 rounded bg-blue-700 px-3 py-1 text-sm text-white" onClick={() => create.mutate()}>
          Lưu nháp
        </button>
      </div>
      <ul className="space-y-3">
        {data?.map((e) => (
          <li key={e.expenseId} className="rounded border bg-white p-3 text-sm">
            <p className="font-medium">{e.expenseCode} · {e.category} · {e.status}</p>
            <p>{e.description} — {Number(e.amount).toLocaleString("vi-VN")} ₫</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {e.status === "DRAFT" && (
                <button type="button" className="text-blue-700" onClick={() => action.mutate({ id: e.expenseId, step: "submit" })}>Gửi duyệt</button>
              )}
              {e.status === "PENDING" && (
                <>
                  <button type="button" onClick={() => action.mutate({ id: e.expenseId, step: "approve" })}>Duyệt</button>
                  <button type="button" onClick={() => action.mutate({ id: e.expenseId, step: "reject" })}>Từ chối</button>
                </>
              )}
              {e.status === "APPROVED" && (
                <button type="button" onClick={() => action.mutate({ id: e.expenseId, step: "mark-paid" })}>Đánh dấu đã chi</button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
