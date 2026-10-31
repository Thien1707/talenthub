"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api/client";
import {
  digitsOnlyInput,
  formatVND,
  parseVndAmount,
} from "@/lib/format-money";
import { MoneyInput } from "@/components/ui/money-input";
import { extractApiErrorMessage } from "@/lib/extract-api-error";

type PromoCode = "TOP_LISTING" | "HIGHLIGHT" | "FEATURED";

type PostingConfig = {
  configId: string;
  basePostFeeVnd: number;
  freePostAllowance: number;
};

type PromotionRow = {
  featureId: string;
  code: PromoCode;
  displayName: string;
  description?: string | null;
  priceVnd: number;
  durationDays: number;
  isActive: boolean;
  sortOrder: number;
};

type ApiPayload = {
  config: PostingConfig;
  promotions: PromotionRow[];
};

const CODE_LABEL: Record<PromoCode, string> = {
  TOP_LISTING: "TOP_LISTING",
  HIGHLIGHT: "HIGHLIGHT",
  FEATURED: "FEATURED",
};

export function PostingPricingManager() {
  const qc = useQueryClient();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin", "posting-config"],
    queryFn: async () => {
      const { data } = await api.get<ApiPayload>("/admin/posting-config");
      return data;
    },
  });

  const [baseFee, setBaseFee] = useState("");
  const [freeAllowance, setFreeAllowance] = useState("");
  const [promoEdits, setPromoEdits] = useState<
    Record<string, Partial<PromotionRow>>
  >({});

  useEffect(() => {
    if (!data) return;
    setBaseFee(String(data.config.basePostFeeVnd));
    setFreeAllowance(String(data.config.freePostAllowance));
    setPromoEdits({});
  }, [data]);

  const saveConfig = useMutation({
    mutationFn: () =>
      api.patch("/admin/posting-config", {
        basePostFeeVnd: parseVndAmount(baseFee) ?? 0,
        freePostAllowance: Number(freeAllowance),
      }),
    onSuccess: () => {
      toast.success("Đã cập nhật phí cơ bản");
      void qc.invalidateQueries({ queryKey: ["admin", "posting-config"] });
    },
    onError: (err: unknown) => {
      toast.error(extractApiErrorMessage(err, "Lưu thất bại"));
    },
  });

  const savePromotion = useMutation({
    mutationFn: ({ code, patch }: { code: PromoCode; patch: object }) =>
      api.patch(`/admin/posting-promotions/${code}`, patch),
    onSuccess: () => {
      toast.success("Đã cập nhật gói quảng bá");
      void qc.invalidateQueries({ queryKey: ["admin", "posting-config"] });
    },
    onError: (err: unknown) => {
      toast.error(extractApiErrorMessage(err, "Lưu gói thất bại"));
    },
  });

  if (isLoading) {
    return <p className="text-sm text-slate-500">Đang tải cấu hình giá…</p>;
  }

  if (isError || !data) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        Không tải được cấu hình. Cần quyền <strong>Super Admin</strong>, API đang chạy
        và đã chạy migration ví/bảng giá (
        <code className="text-xs">npx prisma migrate deploy</code>).
      </div>
    );
  }

  const getPromoField = <K extends keyof PromotionRow>(
    row: PromotionRow,
    key: K,
  ): PromotionRow[K] => {
    const edit = promoEdits[row.code]?.[key];
    return (edit !== undefined ? edit : row[key]) as PromotionRow[K];
  };

  const setPromoField = <K extends keyof PromotionRow>(
    code: PromoCode,
    key: K,
    value: PromotionRow[K],
  ) => {
    setPromoEdits((prev) => ({
      ...prev,
      [code]: { ...prev[code], [key]: value },
    }));
  };

  const buildPromoPatch = (row: PromotionRow) => {
    const edit = promoEdits[row.code];
    if (!edit) return null;
    const patch: Record<string, unknown> = {};
    if (edit.displayName !== undefined) patch.displayName = edit.displayName;
    if (edit.description !== undefined) patch.description = edit.description;
    if (edit.priceVnd !== undefined) patch.priceVnd = Number(edit.priceVnd);
    if (edit.durationDays !== undefined) patch.durationDays = Number(edit.durationDays);
    if (edit.isActive !== undefined) patch.isActive = edit.isActive;
    if (edit.sortOrder !== undefined) patch.sortOrder = Number(edit.sortOrder);
    return Object.keys(patch).length ? patch : null;
  };

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Phí đăng tin cơ bản</h2>
        <p className="mt-1 text-sm text-slate-600">
          Áp dụng cho tin thường từ lượt thứ (N+1) trở đi; tin VIP luôn tính phí cơ bản.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="font-medium text-slate-700">Phí mỗi tin (VND)</span>
            <MoneyInput
              digits={digitsOnlyInput(baseFee)}
              className="mt-1 w-full rounded-lg border px-3 py-2"
              placeholder="5,000"
              onDigitsChange={setBaseFee}
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-slate-700">Số tin miễn phí / công ty</span>
            <input
              type="number"
              min={0}
              step={1}
              className="mt-1 w-full rounded-lg border px-3 py-2"
              value={freeAllowance}
              onChange={(e) => setFreeAllowance(e.target.value)}
            />
          </label>
        </div>
        <button
          type="button"
          disabled={saveConfig.isPending}
          onClick={() => saveConfig.mutate()}
          className="mt-4 flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
        >
          {saveConfig.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Lưu phí cơ bản
        </button>
        <p className="mt-3 text-xs text-slate-500">
          Ví dụ: {freeAllowance || "3"} tin đầu miễn phí, từ tin thứ{" "}
          {Number(freeAllowance || 3) + 1} = {formatVND(parseVndAmount(baseFee) ?? 0)}.
        </p>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Gói quảng bá (tùy chọn khi đăng tin)</h2>
        <p className="mt-1 text-sm text-slate-600">
          NTD chọn khi thanh toán từ ví. Tắt &quot;Đang bán&quot; để ẩn gói khỏi trang đăng tin.
        </p>
        <ul className="mt-6 space-y-6">
          {data.promotions.map((row) => {
            const patch = buildPromoPatch(row);
            const price = getPromoField(row, "priceVnd");
            return (
              <li
                key={row.code}
                className="rounded-xl border border-slate-100 bg-slate-50/80 p-4"
              >
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-xs font-semibold text-slate-500">
                    {CODE_LABEL[row.code]}
                  </span>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={getPromoField(row, "isActive")}
                      onChange={(e) =>
                        setPromoField(row.code, "isActive", e.target.checked)
                      }
                    />
                    Đang bán
                  </label>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="text-sm sm:col-span-2">
                    <span className="font-medium">Tên hiển thị</span>
                    <input
                      className="mt-1 w-full rounded-lg border px-3 py-2"
                      value={getPromoField(row, "displayName")}
                      onChange={(e) =>
                        setPromoField(row.code, "displayName", e.target.value)
                      }
                    />
                  </label>
                  <label className="text-sm sm:col-span-2">
                    <span className="font-medium">Mô tả</span>
                    <textarea
                      rows={2}
                      className="mt-1 w-full rounded-lg border px-3 py-2"
                      value={getPromoField(row, "description") ?? ""}
                      onChange={(e) =>
                        setPromoField(row.code, "description", e.target.value)
                      }
                    />
                  </label>
                  <label className="text-sm">
                    <span className="font-medium">Giá (VND)</span>
                    <MoneyInput
                      digits={digitsOnlyInput(String(price ?? ""))}
                      className="mt-1 w-full rounded-lg border px-3 py-2"
                      placeholder="10,000"
                      onDigitsChange={(d) =>
                        setPromoField(
                          row.code,
                          "priceVnd",
                          parseVndAmount(d) ?? 0,
                        )
                      }
                    />
                  </label>
                  <label className="text-sm">
                    <span className="font-medium">Thời hạn (ngày)</span>
                    <input
                      type="number"
                      min={1}
                      className="mt-1 w-full rounded-lg border px-3 py-2"
                      value={getPromoField(row, "durationDays")}
                      onChange={(e) =>
                        setPromoField(row.code, "durationDays", Number(e.target.value))
                      }
                    />
                  </label>
                  <label className="text-sm">
                    <span className="font-medium">Thứ tự hiển thị</span>
                    <input
                      type="number"
                      className="mt-1 w-full rounded-lg border px-3 py-2"
                      value={getPromoField(row, "sortOrder")}
                      onChange={(e) =>
                        setPromoField(row.code, "sortOrder", Number(e.target.value))
                      }
                    />
                  </label>
                </div>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <span className="text-sm text-slate-600">
                    Giá hiện tại: <strong>{formatVND(price)}</strong> /{" "}
                    {getPromoField(row, "durationDays")} ngày
                  </span>
                  <button
                    type="button"
                    disabled={!patch || savePromotion.isPending}
                    onClick={() => {
                      if (patch) savePromotion.mutate({ code: row.code, patch });
                    }}
                    className="rounded-lg border border-blue-700 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-50 disabled:opacity-50"
                  >
                    Lưu gói này
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
        {!data.promotions.length ? (
          <p className="mt-4 text-sm text-slate-500">
            Chưa có gói quảng bá — chạy migration seed hoặc thêm bản ghi trong DB.
          </p>
        ) : null}
      </section>
    </div>
  );
}
