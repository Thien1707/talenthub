"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { api } from "@/lib/api/client";

const schema = z.object({
  city: z.string().optional(),
  schoolName: z.string().optional(),
  major: z.string().optional(),
  bio: z.string().optional(),
  educationLevel: z.string().optional(),
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
    onError: () => toast.error("Lưu thất bại"),
  });

  if (isLoading) return <p className="text-slate-500">Đang tải hồ sơ...</p>;

  return (
    <form
      onSubmit={handleSubmit((v) => mutation.mutate(v))}
      className="max-w-lg space-y-4"
    >
      {(
        [
          ["city", "Tỉnh/Thành phố"],
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
