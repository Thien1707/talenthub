"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { api } from "@/lib/api/client";

const schema = z
  .object({
    currentPassword: z.string().min(8),
    newPassword: z.string().min(8, "Tối thiểu 8 ký tự"),
    confirmPassword: z.string().min(8),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  });

type Form = z.infer<typeof schema>;

export function ChangePasswordForm() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Form>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await api.post("/auth/change-password", {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      toast.success("Đổi mật khẩu thành công. Vui lòng đăng nhập lại.");
      reset();
    } catch {
      toast.error("Mật khẩu hiện tại không đúng hoặc có lỗi xảy ra");
    }
  });

  return (
    <form onSubmit={onSubmit} className="max-w-md space-y-4">
      {(
        [
          ["currentPassword", "Mật khẩu hiện tại"],
          ["newPassword", "Mật khẩu mới"],
          ["confirmPassword", "Xác nhận mật khẩu"],
        ] as const
      ).map(([name, label]) => (
        <div key={name}>
          <label
            className="mb-1 block text-sm font-extrabold text-[var(--ink)]"
            htmlFor={`pwd-${name}`}
          >
            {label}
          </label>
          <input
            id={`pwd-${name}`}
            type="password"
            className="input-field"
            autoComplete={name === "currentPassword" ? "current-password" : "new-password"}
            {...register(name)}
          />
          {errors[name] && (
            <p className="mt-1 text-sm font-semibold text-red-600">{errors[name]?.message}</p>
          )}
        </div>
      ))}
      <button
        type="submit"
        disabled={isSubmitting}
        className="button button-primary flex items-center gap-2"
      >
        {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
        Cập nhật mật khẩu
      </button>
    </form>
  );
}
