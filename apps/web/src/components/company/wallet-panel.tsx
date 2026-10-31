"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api/client";
import { formatVND, parseVndAmount } from "@/lib/format-money";
import { MoneyInput } from "@/components/ui/money-input";
import { redirectToVnpayTopUp } from "@/lib/wallet-topup";

type Tx = {
  transactionId: string;
  type: string;
  status: string;
  amountVnd: string;
  balanceAfterVnd: string;
  description?: string | null;
  createdAt: string;
  lines?: { label: string; amountVnd: number }[];
};

export function WalletPanel() {
  const qc = useQueryClient();
  const [amount, setAmount] = useState("100000");

  const { data: wallet } = useQuery({
    queryKey: ["wallet", "me"],
    queryFn: async () => {
      const { data } = await api.get<{ balanceVnd: string }>("/wallet/me");
      return data;
    },
    staleTime: 0,
    refetchOnMount: "always",
  });

  const { data: txs } = useQuery({
    queryKey: ["wallet", "transactions"],
    queryFn: async () => {
      const { data } = await api.get<Tx[]>("/wallet/transactions");
      return data;
    },
  });

  const topUp = useMutation({
    mutationFn: () => {
      const vnd = parseVndAmount(amount);
      if (!vnd || vnd < 5_000) {
        throw new Error("MIN_AMOUNT");
      }
      return redirectToVnpayTopUp(vnd);
    },
    onError: (err: unknown) => {
      if (err instanceof Error && err.message === "MIN_AMOUNT") {
        toast.error("Số tiền nạp tối thiểu 5,000 VND");
        return;
      }
      const msg =
        err instanceof Error && err.message
          ? err.message
          : "Không tạo được giao dịch nạp ví";
      toast.error(msg);
    },
  });

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Số dư ví</h2>
        <p className="mt-3 text-3xl font-bold text-blue-700">
          {formatVND(wallet?.balanceVnd ?? 0)}
        </p>
        <p className="mt-2 text-sm text-slate-600">
          Dùng để trả phí đăng tin và gói quảng bá.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          {["50000", "100000", "200000", "500000"].map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setAmount(v)}
              className={`rounded-lg border px-3 py-1.5 text-sm ${
                amount === v ? "border-blue-600 bg-blue-50" : ""
              }`}
            >
              {formatVND(Number(v))}
            </button>
          ))}
        </div>
        <label className="mt-4 block text-sm font-medium text-slate-700">
          Hoặc nhập số tiền nạp
          <MoneyInput
            digits={amount}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            placeholder="100,000"
            onDigitsChange={setAmount}
          />
        </label>
        <button
          type="button"
          disabled={topUp.isPending}
          onClick={() => topUp.mutate()}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
        >
          {topUp.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Nạp ví qua VNPAY
        </button>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Lịch sử giao dịch</h2>
        <ul className="mt-4 max-h-[420px] space-y-3 overflow-y-auto text-sm">
          {!txs?.length ? (
            <li className="text-slate-500">Chưa có giao dịch.</li>
          ) : (
            txs.map((tx) => (
              <li key={tx.transactionId} className="rounded-lg border border-slate-100 p-3">
                <div className="flex justify-between gap-2">
                  <span className="font-medium">{tx.description ?? tx.type}</span>
                  <span
                    className={
                      Number(tx.amountVnd) >= 0 ? "text-emerald-700" : "text-red-700"
                    }
                  >
                    {Number(tx.amountVnd) >= 0 ? "+" : ""}
                    {formatVND(Number(tx.amountVnd))}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Số dư sau: {formatVND(Number(tx.balanceAfterVnd))} ·{" "}
                  {new Date(tx.createdAt).toLocaleString("vi-VN")}
                </p>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
