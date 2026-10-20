"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { dashboardPath, useAuth } from "@/components/auth-provider";
import { loginSchema, type LoginForm } from "@/lib/auth/schemas";

export function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const onSubmit = handleSubmit(async (values) => {
    try {
      const user = await login(values.email, values.password);
      toast.success("Đăng nhập thành công");
      router.push(dashboardPath(user.role));
    } catch {
      toast.error("Email hoặc mật khẩu không đúng");
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-800">
          Email
        </label>
        <input
          type="email"
          className="input-field"
          {...register("email")}
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
        )}
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-800">
          Mật khẩu
        </label>
        <input
          type="password"
          className="input-field"
          {...register("password")}
        />
        {errors.password && (
          <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
        )}
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="button button-primary w-full py-3"
      >
        {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
        Đăng nhập
      </button>
      <p className="text-center text-sm text-slate-700">
        Chưa có tài khoản?{" "}
        <Link href="/dang-ky" className="text-blue-700 hover:underline">
          Đăng ký
        </Link>
      </p>
    </form>
  );
}
