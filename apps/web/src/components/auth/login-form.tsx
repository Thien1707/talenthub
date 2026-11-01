"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { dashboardPath, useAuth } from "@/components/auth-provider";
import { loginSchema, type LoginForm } from "@/lib/auth/schemas";
import formStyles from "./auth-forms.module.css";

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
    <form onSubmit={onSubmit} className={formStyles.form} aria-label="Đăng nhập">
      <div className={formStyles.field}>
        <label className={formStyles.label} htmlFor="login-email">
          Email
        </label>
        <input
          id="login-email"
          type="email"
          autoComplete="email"
          className="input-field"
          {...register("email")}
        />
        {errors.email && (
          <p className={formStyles.error}>{errors.email.message}</p>
        )}
      </div>

      <div className={formStyles.field}>
        <label className={formStyles.label} htmlFor="login-password">
          Mật khẩu
        </label>
        <input
          id="login-password"
          type="password"
          autoComplete="current-password"
          className="input-field"
          {...register("password")}
        />
        {errors.password && (
          <p className={formStyles.error}>{errors.password.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className={`button button-primary ${formStyles.submit}`}
      >
        {isSubmitting && (
          <Loader2 className="mr-1 inline h-4 w-4 animate-spin" aria-hidden />
        )}
        Đăng nhập
      </button>
    </form>
  );
}
