"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api/client";
import { uploadMedia } from "@/lib/api/upload";

type CompanyProfile = {
  companyName: string;
  taxCode?: string | null;
  industry?: string | null;
  companySize?: string | null;
  website?: string | null;
  description?: string | null;
  address?: string | null;
  city?: string | null;
  postingQuota?: {
    freePostLimit: number;
    freePostUsed: number;
    paidPostCount: number;
  } | null;
  logoAsset?: { secureUrl: string } | null;
};

export function CompanyProfileForm() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["company", "profile"],
    queryFn: async () => {
      const { data } = await api.get<CompanyProfile>("/companies/me/profile");
      return data;
    },
  });

  const [logoAssetId, setLogoAssetId] = useState<string | undefined>();
  const [form, setForm] = useState({
    companyName: "",
    taxCode: "",
    industry: "",
    companySize: "",
    website: "",
    description: "",
    address: "",
    city: "",
  });

  useEffect(() => {
    if (data) {
      setForm({
        companyName: data.companyName ?? "",
        taxCode: data.taxCode ?? "",
        industry: data.industry ?? "",
        companySize: data.companySize ?? "",
        website: data.website ?? "",
        description: data.description ?? "",
        address: data.address ?? "",
        city: data.city ?? "",
      });
    }
  }, [data]);

  const uploadLogo = useMutation({
    mutationFn: (file: File) => uploadMedia(file, "COMPANY_LOGO"),
    onSuccess: (asset) => {
      setLogoAssetId(asset.assetId);
      toast.success("Đã tải logo — bấm Lưu hồ sơ để áp dụng");
    },
    onError: () => toast.error("Upload logo thất bại (Cloudinary?)"),
  });

  const mutation = useMutation({
    mutationFn: () =>
      api.patch("/companies/me/profile", {
        ...form,
        ...(logoAssetId ? { logoAssetId } : {}),
      }),
    onSuccess: () => {
      toast.success("Đã lưu hồ sơ công ty");
      void qc.invalidateQueries({ queryKey: ["company", "profile"] });
    },
    onError: () => toast.error("Lưu thất bại"),
  });

  if (isLoading) return <p className="text-slate-600">Đang tải...</p>;

  return (
    <div className="space-y-6">
      {data?.postingQuota && (
        <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-800">
          Đăng tin miễn phí: {data.postingQuota.freePostUsed}/
          {data.postingQuota.freePostLimit} · Tin trả phí đã dùng:{" "}
          {data.postingQuota.paidPostCount}
        </div>
      )}
      <div className="grid max-w-xl gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-800">
            Logo công ty
          </label>
          {data?.logoAsset?.secureUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={data.logoAsset.secureUrl}
              alt="Logo"
              className="mb-2 h-16 w-16 rounded-lg border object-cover"
            />
          )}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) uploadLogo.mutate(f);
            }}
          />
        </div>
        {(
          [
            ["companyName", "Tên công ty"],
            ["taxCode", "Mã số thuế"],
            ["industry", "Lĩnh vực"],
            ["companySize", "Quy mô"],
            ["website", "Website"],
            ["city", "Tỉnh/Thành"],
            ["address", "Địa chỉ"],
          ] as const
        ).map(([key, label]) => (
          <div key={key}>
            <label className="mb-1 block text-sm font-medium text-slate-800">
              {label}
            </label>
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
              value={form[key]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
            />
          </div>
        ))}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-800">
            Giới thiệu
          </label>
          <textarea
            rows={4}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>
        <button
          type="button"
          disabled={mutation.isPending}
          onClick={() => mutation.mutate()}
          className="flex w-fit items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-white hover:bg-blue-800 disabled:opacity-60"
        >
          {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Lưu hồ sơ
        </button>
      </div>
    </div>
  );
}
