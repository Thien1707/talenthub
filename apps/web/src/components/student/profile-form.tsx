"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { LocationFields } from "@/components/locations/location-fields";
import { api } from "@/lib/api/client";
import { extractApiErrorMessage } from "@/lib/extract-api-error";

const schema = z.object({
  city: z.string().nullish(),
  province: z.string().nullish(),
  ward: z.string().nullish(),
  schoolName: z.string().nullish(),
  major: z.string().nullish(),
  bio: z.string().nullish(),
  educationLevel: z.string().nullish(),
});

type FormValues = z.infer<typeof schema>;

export function StudentProfileForm() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["student", "profile"],
    queryFn: async () => {
      const { data } = await api.get<FormValues>("/students/me/profile");
      return data;
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (data) reset(data);
  }, [data, reset]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      api.patch("/students/me/profile", values),
    onSuccess: () => {
      toast.success("Đã lưu hồ sơ");
      void qc.invalidateQueries({ queryKey: ["student", "profile"] });
    },
    onError: (error) =>
      toast.error(extractApiErrorMessage(error, "Lưu hồ sơ thất bại")),
  });

  const province = watch("province") ?? "";
  const ward = watch("ward") ?? "";

  if (isLoading) return <p className="text-slate-500">Đang tải hồ sơ...</p>;

  return (
    <form
      onSubmit={handleSubmit((v) => mutation.mutate(v))}
      className="max-w-lg space-y-4"
    >
      <LocationFields
        province={province}
        ward={ward}
        provinceLabel="Nơi ở — tỉnh/thành phố"
        wardLabel="Nơi ở — phường/xã"
        onChange={(location) => {
          setValue("province", location.province, { shouldDirty: true });
          setValue("ward", location.ward, { shouldDirty: true });
        }}
      />
      {(
        [
          ["schoolName", "Trường học"],
          ["major", "Chuyên ngành"],
          ["educationLevel", "Trình độ"],
        ] as const
      ).map(([name, label]) => (
        <div key={name}>
          <label className="mb-1 block text-sm font-medium">{label}</label>
          <input
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
            {...register(name)}
          />
        </div>
      ))}
      <div>
        <label className="mb-1 block text-sm font-medium">Giới thiệu</label>
        <textarea
          rows={4}
          className="w-full rounded-lg border border-slate-300 px-3 py-2"
          {...register("bio")}
        />
      </div>
      <button
        type="submit"
        disabled={isSubmitting || mutation.isPending}
        className="flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-white hover:bg-blue-800 disabled:opacity-60"
      >
        {(isSubmitting || mutation.isPending) && (
          <Loader2 className="h-4 w-4 animate-spin" />
        )}
        Lưu hồ sơ
      </button>
    </form>
  );
}
