"use client";

import { useId } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";

type Province = { code: string; name: string };
type Ward = { name: string };

type LocationFieldsProps = {
  province: string;
  ward: string;
  onChange: (location: { province: string; ward: string }) => void;
  provinceLabel?: string;
  wardLabel?: string;
  required?: boolean;
  className?: string;
};

export function LocationFields({
  province,
  ward,
  onChange,
  provinceLabel = "Tỉnh/Thành phố",
  wardLabel = "Phường/Xã",
  required = false,
  className,
}: LocationFieldsProps) {
  const instanceId = useId();
  const provinceListId = `${instanceId}-provinces`;
  const wardListId = `${instanceId}-wards`;
  const provincesQuery = useQuery({
    queryKey: ["locations", "provinces"],
    queryFn: async () => {
      const { data } = await api.get<Province[]>("/locations/provinces");
      return data;
    },
    staleTime: 60 * 60 * 1000,
  });

  const selectedProvince = provincesQuery.data?.find(
    (item) => item.name === province,
  );
  const wardsQuery = useQuery({
    queryKey: ["locations", "wards", selectedProvince?.code],
    queryFn: async () => {
      const { data } = await api.get<Ward[]>(
        `/locations/provinces/${selectedProvince!.code}/wards`,
      );
      return data;
    },
    enabled: Boolean(selectedProvince?.code),
    staleTime: 60 * 60 * 1000,
  });

  return (
    <div className={className}>
      <div>
        <label className="mb-1 block text-sm font-medium">
          {provinceLabel}
          {required ? " *" : ""}
        </label>
        <input
          type="text"
          list={provinceListId}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
          value={province}
          disabled={provincesQuery.isPending || provincesQuery.isError}
          required={required}
          onChange={(event) =>
            onChange({ province: event.target.value, ward: "" })
          }
          placeholder={
            provincesQuery.isPending
              ? "Đang tải tỉnh/thành phố..."
              : "Nhập để tìm tỉnh/thành phố"
          }
        />
        <datalist id={provinceListId}>
          {provincesQuery.data?.map((item) => (
            <option key={item.code} value={item.name}>
            </option>
          ))}
        </datalist>
        {provincesQuery.isError ? (
          <p role="alert" className="mt-1 text-xs text-red-600">
            Không tải được danh sách tỉnh/thành phố.
          </p>
        ) : null}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">{wardLabel}</label>
        <input
          type="text"
          list={wardListId}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 disabled:bg-slate-100"
          value={ward}
          disabled={!selectedProvince || wardsQuery.isPending || wardsQuery.isError}
          onChange={(event) =>
            onChange({ province, ward: event.target.value })
          }
          placeholder={
            !selectedProvince
              ? "Chọn tỉnh/thành phố trước"
              : wardsQuery.isPending
                ? "Đang tải phường/xã..."
                : "Nhập để tìm phường/xã (không bắt buộc)"
          }
        />
        <datalist id={wardListId}>
          {wardsQuery.data?.map((item) => (
            <option key={item.name} value={item.name}>
            </option>
          ))}
        </datalist>
        {wardsQuery.isError ? (
          <p role="alert" className="mt-1 text-xs text-red-600">
            Không tải được danh sách phường/xã.
          </p>
        ) : null}
      </div>
    </div>
  );
}
